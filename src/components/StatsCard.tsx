'use client';

import React from 'react';
import { StatsCardProps } from '@/types';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  loading = false 
}: StatsCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              <span className="text-gray-500 text-sm">Loading...</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-white">{value}</h3>
              {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}