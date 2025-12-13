import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

interface RawMetrics {
  persons: number;
  users: number;
  aliases: number;
  contactEdges: number;
  trustEdges: number;
  callLogs: number;
  dailyActiveUsers: { count: number; trending: number };
  totalSyncs: { count: number; trending: number };
  networkUpdates: { count: number; trending: number };
  totalUsers: { count: number; trending: number };
  conflictsResolved: { count: number; trending: number };
  businessClaims: { count: number; trending: number };
}

interface ActivityDay {
  date: string;
  users: number;
  syncs: number;
  conflicts: number;
}

interface Contributor {
  name: string;
  syncs: number;
  applies: number;
  score: number;
}

/**
 * Admin dashboard page.  Displays high-level metrics about the system.
 * Only users with the `admin` role may view this page.
 */
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<RawMetrics | null>(null);
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Selected range for activity (7, 14, or 30 days)
  const [range, setRange] = useState<string>("7");
  const router = useRouter();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, range]);

  /**
   * Fetch metrics and activity.  Passes the selected range to the
   * /api/admin/activity endpoint via the `days` query parameter.
   */
  async function fetchData() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const metricsResp = fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      /* const activityResp = fetch(`/api/admin/activity?days=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });*/
      const [mResp, aResp] = await Promise.all([metricsResp, activityResp]);
      if (mResp.status === 401 || aResp.status === 401) {
        router.push("/login");
        return;
      }
      if (!mResp.ok) {
        const err = await mResp.json();
        throw new Error(err.message || "Failed to load metrics");
      }
      if (!aResp.ok) {
        const err = await aResp.json();
        throw new Error(err.message || "Failed to load activity");
      }
      const metricsData: RawMetrics = await mResp.json();
      const activityData = await aResp.json();
      setMetrics(metricsData);
      setDays(activityData.days || []);
      setContributors(activityData.topContributors || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Render a trend arrow with a colour based on sign of the percentage
  function renderTrending(value: number) {
    const isUp = value >= 0;
    const absVal = Math.abs(value).toFixed(1);
    const color = isUp ? "text-green-600" : "text-red-600";
    const arrow = isUp ? "↑" : "↓";
    return (
      <span className={`ml-2 text-xs ${color}`}>
        {arrow} {absVal}%
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Monitor platform metrics and user activity</p>
          </div>
          {/* Date range selector and refresh control */}
          <div className="flex items-center space-x-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <button
              onClick={fetchData}
              className="flex items-center px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-2">🔄</span> Refresh
            </button>
          </div>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {!metrics && !error && <div>Loading metrics…</div>}
        {metrics && (
          <>
            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              {/* Daily Active Users */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Daily Active Users</div>
                    <div className="text-2xl font-semibold">{metrics.dailyActiveUsers.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">👥</div>
                </div>
                {renderTrending(metrics.dailyActiveUsers.trending)}
              </div>
              {/* Total Syncs */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Syncs</div>
                    <div className="text-2xl font-semibold">{metrics.totalSyncs.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">🔄</div>
                </div>
                {renderTrending(metrics.totalSyncs.trending)}
              </div>
              {/* Network Updates Applied */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Network Updates Applied</div>
                    <div className="text-2xl font-semibold">{metrics.networkUpdates.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">🧩</div>
                </div>
                {renderTrending(metrics.networkUpdates.trending)}
              </div>
              {/* Total Users */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Users</div>
                    <div className="text-2xl font-semibold">{metrics.totalUsers.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">📦</div>
                </div>
                {renderTrending(metrics.totalUsers.trending)}
              </div>
              {/* Conflicts Resolved */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Conflicts Resolved</div>
                    <div className="text-2xl font-semibold">{metrics.conflictsResolved.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">🛡️</div>
                </div>
                {renderTrending(metrics.conflictsResolved.trending)}
              </div>
              {/* Business Claims */}
              <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Business Claims</div>
                    <div className="text-2xl font-semibold">{metrics.businessClaims.count.toLocaleString()}</div>
                  </div>
                  <div className="text-gray-400 text-3xl">📈</div>
                </div>
                {renderTrending(metrics.businessClaims.trending)}
              </div>
            </div>

            {/* Daily Activity & Top Contributors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold mb-4">Daily Activity</h3>
                <p className="text-sm text-gray-500 mb-4">User activity over the selected period</p>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 text-right">Users</th>
                      <th className="px-4 py-2 text-right">Syncs</th>
                      <th className="px-4 py-2 text-right">Conflicts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {days.map((day) => (
                      <tr key={day.date} className="text-sm text-gray-700">
                        <td className="px-4 py-2 whitespace-nowrap">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-right">{day.users.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{day.syncs.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{day.conflicts.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Top Contributors */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold mb-4">Top Network Contributors</h3>
                <p className="text-sm text-gray-500 mb-4">Most active users in the network</p>
                <ul className="space-y-3">
                  {contributors.map((c, index) => (
                    <li key={c.name} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-700 mr-2">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-800">{c.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {c.syncs} syncs • {c.applies} applies
                        </span>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Score {c.score}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

