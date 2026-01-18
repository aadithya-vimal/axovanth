import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- QUERIES ---

export const getFinancialStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const retainers = await ctx.db
      .query("retainers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // 1. Calculate Cash Flow
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    let totalIncome = 0;
    let totalExpense = 0;
    let adSpend = 0;
    let recentHistory = [];
    
    let runningBalance = 0; 

    // Sort transactions by date ascending for accurate running balance calculation
    const sortedTransactions = transactions.sort((a, b) => a.date - b.date);

    for (const t of sortedTransactions) {
      if (t.status === 'rejected') continue;
      
      if (t.type === 'income') {
        totalIncome += t.amount;
        runningBalance += t.amount;
      } else {
        totalExpense += t.amount;
        runningBalance -= t.amount;
        if (t.isAdSpend) adSpend += t.amount;
      }

      // Only add to chart if within last 30 days
      if (t.date > thirtyDaysAgo) {
        recentHistory.push({ date: t.date, amount: t.amount, type: t.type });
      }
    }

    // 2. Burn Rate & Runway
    const monthlyBurn = totalExpense > 0 ? totalExpense : 0; 
    const runwayMonths = monthlyBurn > 0 ? (runningBalance / monthlyBurn) : 0;

    // 3. Category Breakdown
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      adSpend,
      runwayMonths: Math.round(runwayMonths * 10) / 10,
      balance: runningBalance,
      recentHistory: recentHistory, // Already sorted
      categoryBreakdown: Object.entries(categories).map(([name, value]) => ({ name, value })),
      retainers
    };
  }
});

// NEW: Aggregates expenses per workspace against their set budget
export const getBudgetOverview = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_company", q => q.eq("companyId", args.companyId))
      .collect();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_company", q => q.eq("companyId", args.companyId))
      .collect();

    // Map workspace IDs to expense totals
    const spendingMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.workspaceId) {
        spendingMap[t.workspaceId] = (spendingMap[t.workspaceId] || 0) + t.amount;
      }
    });

    return workspaces.map(ws => ({
      _id: ws._id,
      name: ws.name,
      emoji: ws.emoji,
      budget: ws.budget || 0,
      spent: spendingMap[ws._id] || 0
    }));
  }
});

export const getTransactions = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(100);
    
    return Promise.all(txs.map(async (t) => {
      const user = await ctx.db.get(t.userId);
      let workspaceName = "General";
      if (t.workspaceId) {
        const ws = await ctx.db.get(t.workspaceId);
        if (ws) workspaceName = ws.name;
      }
      return { ...t, authorName: user?.name, workspaceName };
    }));
  }
});

// --- MUTATIONS ---

export const logTransaction = mutation({
  args: {
    companyId: v.id("companies"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(), 
    category: v.string(),
    isAdSpend: v.boolean(),
    date: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")), // Now accepts workspace tagging
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    await ctx.db.insert("transactions", {
      companyId: args.companyId,
      userId: user._id,
      type: args.type,
      amount: args.amount,
      description: args.description,
      category: args.category,
      date: args.date || Date.now(),
      status: "approved",
      isAdSpend: args.isAdSpend,
      workspaceId: args.workspaceId
    });
  }
});

export const deleteTransaction = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.transactionId);
  }
});

export const createRetainer = mutation({
  args: { companyId: v.id("companies"), clientName: v.string(), totalBudget: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("retainers", {
      companyId: args.companyId,
      clientName: args.clientName,
      totalBudget: args.totalBudget,
      usedBudget: 0,
      status: "active",
      lastUpdated: Date.now()
    });
  }
});

// NEW: Set budget for a workspace
export const setWorkspaceBudget = mutation({
  args: { workspaceId: v.id("workspaces"), budget: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workspaceId, { budget: args.budget });
  }
});