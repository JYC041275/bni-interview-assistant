import React from 'react';
import { Info, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { TokenUsage } from '../types';
import { getTotalUsageStats, formatCost, formatTokens } from '../services/tokenTracker';

interface TokenUsageDisplayProps {
    currentUsage?: TokenUsage;
    modelName?: string;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ currentUsage, modelName }) => {
    const totalStats = getTotalUsageStats();

    if (!currentUsage && totalStats.totalAnalyses === 0) {
        return null;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-sm shadow-sm">
            {/* Left side: Current Analysis or General Info */}
            <div className="flex items-center gap-4">
                {currentUsage ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1 rounded-full">
                                <Info className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700">本次分析</span>
                                    {modelName && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                            {modelName}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                                    <span className="bg-green-100 px-1.5 rounded">免費額度適用</span>
                                    <span className="text-gray-400">|</span>
                                    <span>預估價值: {formatCost(currentUsage.costNTD)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Token 用量</span>
                            <span className="font-medium text-gray-900">
                                {formatTokens(currentUsage.totalTokens)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Info className="w-4 h-4" />
                        <span>尚未進行分析</span>
                    </div>
                )}
            </div>

            {/* Right side: Cumulative Stats */}
            <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">累計 ({totalStats.totalAnalyses}次):</span>
                </div>

                <div className="flex items-center gap-3">
                    <div>
                        <span className="text-gray-500 text-xs mr-1">總用量:</span>
                        <span className="font-medium text-gray-900">
                            {formatTokens(totalStats.totalTokens)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs mr-1">總費用:</span>
                        <span className="font-bold text-green-600">
                            {formatCost(totalStats.totalCostNTD)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
