import { TokenUsage } from '../types';

const STORAGE_KEY = 'bni_token_usage_history';
const USD_TO_NTD_RATE = 32; // 匯率

// Gemini 2.5 Flash 定價
const PRICING = {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
};

/**
 * 計算 token 使用費用
 */
export function calculateCost(inputTokens: number, outputTokens: number): {
    costUSD: number;
    costNTD: number;
} {
    const inputCost = (inputTokens / 1_000_000) * PRICING.inputPerMillion;
    const outputCost = (outputTokens / 1_000_000) * PRICING.outputPerMillion;
    const costUSD = inputCost + outputCost;
    const costNTD = costUSD * USD_TO_NTD_RATE;

    return {
        costUSD: parseFloat(costUSD.toFixed(4)),
        costNTD: parseFloat(costNTD.toFixed(2)),
    };
}

/**
 * 估算音檔的 token 數量
 * Gemini: 1 秒音檔 = 32 tokens
 */
export function estimateAudioTokens(durationSeconds: number): number {
    return durationSeconds * 32;
}

/**
 * 記錄 token 使用量
 */
export function recordTokenUsage(usage: TokenUsage): void {
    const history = getTokenUsageHistory();
    history.push(usage);

    // 只保留最近 100 筆記錄
    const recentHistory = history.slice(-100);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentHistory));
    } catch (error) {
        console.error('Failed to save token usage history:', error);
    }
}

/**
 * 取得 token 使用歷史
 */
export function getTokenUsageHistory(): TokenUsage[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load token usage history:', error);
        return [];
    }
}

/**
 * 取得累計統計
 */
export function getTotalUsageStats(): {
    totalAnalyses: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUSD: number;
    totalCostNTD: number;
} {
    const history = getTokenUsageHistory();

    return history.reduce(
        (acc, usage) => ({
            totalAnalyses: acc.totalAnalyses + 1,
            totalInputTokens: acc.totalInputTokens + usage.inputTokens,
            totalOutputTokens: acc.totalOutputTokens + usage.outputTokens,
            totalTokens: acc.totalTokens + usage.totalTokens,
            totalCostUSD: acc.totalCostUSD + usage.costUSD,
            totalCostNTD: acc.totalCostNTD + usage.costNTD,
        }),
        {
            totalAnalyses: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            totalCostUSD: 0,
            totalCostNTD: 0,
        }
    );
}

/**
 * 清除歷史記錄
 */
export function clearTokenUsageHistory(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear token usage history:', error);
    }
}

/**
 * 格式化費用顯示
 */
export function formatCost(costNTD: number): string {
    return `NT$${costNTD.toFixed(2)}`;
}

/**
 * 格式化 token 數量
 */
export function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(2)}M`;
    } else if (tokens >= 1_000) {
        return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
}
