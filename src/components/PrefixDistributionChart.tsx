import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BatchCheckItemResult, Language } from '../types';
import { formatBnNumber, formatCurrency } from '../i18n/translations';
import { BarChart3, Trophy, Info, TrendingUp, Sparkles, Flame } from 'lucide-react';

interface PrefixDistributionChartProps {
  results: BatchCheckItemResult[];
  lang: Language;
}

interface PrefixStat {
  prefix: string;
  count: number;
  totalGross: number;
  totalNet: number;
}

export const PrefixDistributionChart: React.FC<PrefixDistributionChartProps> = ({ results, lang }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredData, setHoveredData] = useState<PrefixStat | null>(null);

  // Filter winning results and calculate prefix distribution
  const winningResults = results.filter((r) => r.result === 'WIN');

  const prefixStats: PrefixStat[] = React.useMemo(() => {
    const map = new Map<string, { count: number; totalGross: number; totalNet: number }>();

    for (const item of winningResults) {
      const prefix = item.series?.trim()
        ? item.series.trim().toUpperCase()
        : item.number
        ? `Prefix-${item.number.slice(0, 2)}`
        : 'Unknown';

      const prev = map.get(prefix) || { count: 0, totalGross: 0, totalNet: 0 };
      const gross = item.winning_info?.gross_prize_amount || 0;
      const net = item.winning_info?.net_payable_amount || 0;

      map.set(prefix, {
        count: prev.count + 1,
        totalGross: prev.totalGross + gross,
        totalNet: prev.totalNet + net
      });
    }

    const arr: PrefixStat[] = Array.from(map.entries()).map(([prefix, val]) => ({
      prefix,
      count: val.count,
      totalGross: val.totalGross,
      totalNet: val.totalNet
    }));

    // Sort descending by count, then alphabetical
    arr.sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));
    return arr;
  }, [winningResults]);

  // Calculate winning digits frequency and trend analysis (Top 3 most frequent digits)
  const digitTrendStats = React.useMemo(() => {
    if (winningResults.length === 0) {
      return { top3: [], allDigits: [], totalDigits: 0, top3PctSum: '0.0' };
    }

    const counts: Record<string, number> = {
      '0': 0, '1': 0, '2': 0, '3': 0, '4': 0,
      '5': 0, '6': 0, '7': 0, '8': 0, '9': 0
    };
    let total = 0;

    winningResults.forEach((w) => {
      const numStr = (w.number || '').replace(/[^0-9]/g, '');
      for (const char of numStr) {
        if (counts[char] !== undefined) {
          counts[char] += 1;
          total += 1;
        }
      }
    });

    const sorted = Object.entries(counts)
      .map(([digit, count]) => ({
        digit,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count || a.digit.localeCompare(b.digit));

    const top3 = sorted.slice(0, 3);
    const top3Count = top3.reduce((sum, item) => sum + item.count, 0);
    const top3PctSum = total > 0 ? ((top3Count / total) * 100).toFixed(1) : '0.0';

    return {
      top3,
      allDigits: sorted,
      totalDigits: total,
      top3PctSum
    };
  }, [winningResults]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous D3 elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (prefixStats.length === 0) {
      return;
    }

    const containerWidth = containerRef.current.clientWidth || 400;
    const height = 200;
    const margin = { top: 25, right: 20, bottom: 35, left: 35 };
    const width = containerWidth;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scaleBand()
      .domain(prefixStats.map((d) => d.prefix))
      .range([0, innerWidth])
      .padding(prefixStats.length > 5 ? 0.25 : 0.4);

    // Y Scale
    const maxCount = d3.max(prefixStats, (d) => d.count) || 1;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(maxCount, 2)])
      .nice()
      .range([innerHeight, 0]);

    // Grid lines (horizontal)
    g.append('g')
      .attr('class', 'grid-lines')
      .call(
        d3
          .axisLeft(y)
          .ticks(Math.min(maxCount + 1, 4))
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    g.select('.grid-lines .domain').remove();

    // X Axis
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    xAxis.select('.domain').attr('stroke', '#cbd5e1');
    xAxis
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('dy', '10px');

    // Y Axis
    const yAxis = g.append('g').call(
      d3
        .axisLeft(y)
        .ticks(Math.min(maxCount + 1, 4))
        .tickFormat((d) => `${d}`)
    );

    yAxis.select('.domain').attr('stroke', '#cbd5e1');
    yAxis.selectAll('text').attr('fill', '#64748b').attr('font-size', '10px').attr('font-weight', '600');

    // Create defs for bar gradient
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'd3-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#059669');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#006A4E');

    // Draw Bars
    const bars = g
      .selectAll('.prefix-bar')
      .data(prefixStats)
      .enter()
      .append('rect')
      .attr('class', 'prefix-bar')
      .attr('x', (d) => x(d.prefix) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#d3-bar-gradient)')
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setHoveredData(d);
      })
      .on('mouseleave', () => {
        setHoveredData(null);
      });

    // Animate bars growing upwards
    bars
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => innerHeight - y(d.count));

    // Value labels on top of bars
    g.selectAll('.bar-label')
      .data(prefixStats)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (x(d.prefix) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.count) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#047857')
      .text((d) => (lang === 'bn' ? `${formatBnNumber(d.count)}টি` : `${d.count} ${d.count === 1 ? 'win' : 'wins'}`))
      .style('opacity', 0)
      .transition()
      .delay(400)
      .duration(300)
      .style('opacity', 1);
  }, [prefixStats, lang]);

  return (
    <div
      ref={containerRef}
      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'বিজয়ী বন্ড প্রিফিক্স ও সিরিজ বিন্যাস (D3 চার্ট)' : 'Winning Prize Bond Prefix Distribution'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'ব্যাচ অনুসন্ধানে প্রাপ্ত বিজয়ী বন্ডের সিরিজভিত্তিক তুলনামূলক পরিসংখ্যান'
                : 'Frequency distribution of winning series/prefixes identified in this search'}
            </p>
          </div>
        </div>

        {winningResults.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {lang === 'bn'
              ? `${formatBnNumber(prefixStats.length)}টি সিরিজ বিজয়ী`
              : `${prefixStats.length} Winning ${prefixStats.length === 1 ? 'Series' : 'Series'}`}
          </span>
        )}
      </div>

      {winningResults.length === 0 ? (
        <div className="py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
          <Info className="w-5 h-5 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {lang === 'bn'
              ? 'এই ব্যাচে কোনো বিজয়ী বন্ড পাওয়া যায়নি।'
              : 'No winning bonds found in this search batch to map distribution.'}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === 'bn'
              ? 'অন্যান্য ড্র নির্বাচন করুন বা আরও বন্ড নম্বর যোগ করুন।'
              : 'Select other historical draws or generate a wider range of serials.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* D3 Render Target */}
          <div className="relative">
            <svg ref={svgRef} className="w-full overflow-visible" />

            {/* Interactive Hover Tooltip Banner */}
            {hoveredData && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Series <span className="font-mono text-emerald-700 dark:text-emerald-400">{hoveredData.prefix}</span>:
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {lang === 'bn' ? `${formatBnNumber(hoveredData.count)}টি পুরস্কার` : `${hoveredData.count} Winning Prize(s)`}
                  </span>
                </div>
                <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  Net: {formatCurrency(hoveredData.totalNet, lang)}
                </div>
              </div>
            )}
          </div>

          {/* Trend Analysis Summary: Top 3 Most Frequent Winning Digits */}
          {digitTrendStats.top3.length > 0 && (
            <div
              id="batch-winning-digits-trend-summary"
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === 'bn' ? 'শীর্ষ ৩ বিজয়ী ডিজিট ট্রেন্ড বিশ্লেষণ' : 'Top 3 Winning Digits Trend Analysis'}
                  </h5>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? `মোট ${formatBnNumber(digitTrendStats.totalDigits)}টি বিশ্লেষিত ডিজিট`
                    : `${digitTrendStats.totalDigits} Total Digits Analyzed`}
                </span>
              </div>

              {/* Top 3 Frequent Digits Podium Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {digitTrendStats.top3.map((item, rankIdx) => {
                  const medal = rankIdx === 0 ? '🥇 #1' : rankIdx === 1 ? '🥈 #2' : '🥉 #3';
                  const badgeColor =
                    rankIdx === 0
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : rankIdx === 1
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                      : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';

                  return (
                    <div
                      key={item.digit}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center shadow-2xs space-y-1"
                    >
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {medal}
                      </span>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-0.5">
                        {lang === 'bn' ? formatBnNumber(item.digit) : item.digit}
                      </div>
                      <p className="text-[11px] font-bold text-[#006A4E] dark:text-emerald-400">
                        {lang === 'bn' ? `${formatBnNumber(item.count)} বার (${formatBnNumber(item.percentage)}%)` : `${item.count} hits (${item.percentage}%)`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Trend Insight Footer */}
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  {lang === 'bn' ? (
                    <>
                      <strong>ডিজিট ট্রেন্ড বিশ্লেষণ:</strong> শীর্ষ ৩টি ডিজিট (
                      <span className="font-mono font-bold">
                        {digitTrendStats.top3.map((d) => formatBnNumber(d.digit)).join(', ')}
                      </span>
                      ) এই ব্যাচে প্রাপ্ত বিজয়ী বন্ডের মোট ডিজিটের{' '}
                      <strong>{formatBnNumber(digitTrendStats.top3PctSum)}%</strong> অংশ জুড়ে অবস্থান করছে।
                    </>
                  ) : (
                    <>
                      <strong>Pattern Insight:</strong> Top 3 winning digits (
                      <span className="font-mono font-bold">
                        {digitTrendStats.top3.map((d) => d.digit).join(', ')}
                      </span>
                      ) account for <strong>{digitTrendStats.top3PctSum}%</strong> of all serial digits across winning bonds in this search.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
