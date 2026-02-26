//*** File: safecontacts/lib/trustAlgorithms.ts
import TrustEdge from '../models/TrustEdge';

/**
 * Helper to build a trust adjacency matrix and list of unique user IDs.
 * Each directed edge (fromUserId -> toUserId) contributes a 1 in the
 * adjacency matrix. Only confirmed trust edges are considered.
 */
export async function buildTrustAdjacency(): Promise<{ users: string[]; adjacency: number[][] }> {
  const edges = await TrustEdge.find({ confirmed: true }).lean();
  const userSet = new Set<string>();
  edges.forEach((e: any) => {
    userSet.add(e.fromUserId);
    userSet.add(e.toUserId);
  });
  const users = Array.from(userSet);
  const index: Record<string, number> = {};
  users.forEach((u, idx) => {
    index[u] = idx;
  });
  const n = users.length;
  const adjacency: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  edges.forEach((e: any) => {
    const i = index[e.fromUserId];
    const j = index[e.toUserId];
    if (i !== undefined && j !== undefined) {
      adjacency[i][j] = 1;
    }
  });
  return { users, adjacency };
}

/**
 * Compute PageRank scores for all users in the trust graph.
 * @param damping The damping factor (usually 0.85)
 * @param maxIter Maximum number of iterations to run
 * @param tolerance Convergence tolerance
 * @returns A mapping from userId to PageRank score
 */
export async function computePageRank(
  damping = 0.85,
  maxIter = 100,
  tolerance = 1e-6,
): Promise<Record<string, number>> {
  const { users, adjacency } = await buildTrustAdjacency();
  const n = users.length;
  if (n === 0) return {};
  const outDegree = adjacency.map((row) => row.reduce((acc, v) => acc + v, 0));
  let ranks = Array(n).fill(1 / n);
  let newRanks = Array(n).fill(0);
  const incoming: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (adjacency[j][i] > 0) {
        incoming[i].push(j);
      }
    }
  }
  for (let iter = 0; iter < maxIter; iter++) {
    let diff = 0;
    for (let i = 0; i < n; i++) {
      let rankSum = 0;
      incoming[i].forEach((j) => {
        const deg = outDegree[j] || n;
        rankSum += ranks[j] / deg;
      });
      newRanks[i] = (1 - damping) / n + damping * rankSum;
    }
    diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(newRanks[i] - ranks[i]);
    }
    ranks = newRanks.slice();
    if (diff < tolerance) break;
  }
  const result: Record<string, number> = {};
  users.forEach((u, idx) => {
    result[u] = ranks[idx];
  });
  return result;
}

/**
 * Compute a weighted propagation score from currentUserId to targetUserId.
 * We assign a weight of 1 for direct edges, 0.5 for second-degree connections,
 * and 0.25 for third-degree connections. Paths beyond length 3 are ignored.
 * @param currentUserId The ID of the user doing the trust evaluation
 * @param targetUserId The ID of the user to compute a weighted score for
 * @returns Weighted trust score between 0 and 1
 */
export async function computeWeightedPropagationScore(
  currentUserId: string,
  targetUserId: string,
): Promise<number> {
  const { users, adjacency } = await buildTrustAdjacency();
  const index: Record<string, number> = {};
  users.forEach((u, idx) => {
    index[u] = idx;
  });
  if (!(currentUserId in index) || !(targetUserId in index)) return 0;
  const start = index[currentUserId];
  const target = index[targetUserId];
  let score = 0;
  adjacency[start].forEach((val, j) => {
    if (val > 0 && j === target) {
      score = 1;
    }
  });
  adjacency[start].forEach((val, j) => {
    if (val > 0) {
      adjacency[j].forEach((val2, k) => {
        if (val2 > 0 && k === target) {
          score = 0.5;
        }
      });
    }
  });
  adjacency[start].forEach((val, j) => {
    if (val > 0) {
      adjacency[j].forEach((val2, k) => {
        if (val2 > 0) {
          adjacency[k].forEach((val3, m) => {
            if (val3 > 0 && m === target) {
              score = 0.25;
            }
          });
        }
      });
    }
  });
  return Math.min(score / 1.75, 1);
}

/**
 * Predict missing trust edges using a simple matrix factorization approach.
 * We factorize the user–user trust adjacency matrix into two lower-dimensional
 * matrices P and Q using stochastic gradient descent. Only existing edges are
 * used as positive examples. No explicit negative examples are included,
 * so predictions will tend towards zero unless reinforced by shared features.
 * @param k Number of latent factors
 * @param steps Number of training steps (iterations)
 * @param lr Learning rate
 * @param lambda Regularization parameter
 * @returns An array of potential trust edges with scores, sorted descending
 */
export async function predictMissingTrustEdges(
  k = 2,
  steps = 50,
  lr = 0.01,
  lambda = 0.02,
): Promise<{ from: string; to: string; score: number }[]> {
  const { users, adjacency } = await buildTrustAdjacency();
  const n = users.length;
  if (n === 0) return [];
  let P: number[][] = Array.from({ length: n }, () => Array.from({ length: k }, () => Math.random() * 0.1));
  let Q: number[][] = Array.from({ length: n }, () => Array.from({ length: k }, () => Math.random() * 0.1));
  for (let step = 0; step < steps; step) {
    for (let u = 0; u < n; u) {
      for (let v = 0; v < n; v) {
        const r = adjacency[u][v];
        if (r > 0) {
          let pred = 0;
          for (let f = 0; f < k; f) {
            pred = P[u][f] * Q[v][f];
          }
          const err = r - pred;
          for (let f = 0; f < k; f) {
            const pu = P[u][f];
            const qv = Q[v][f];
            P[u][f] = lr * (err * qv - lambda * pu);
            Q[v][f] = lr * (err * pu - lambda * qv);
          }
        }
      }
    }
  }
  const predictions: { from: string; to: string; score: number }[] = [];
  for (let u = 0; u < n; u) {
    for (let v = 0; v < n; v) {
      if (u === v) continue;
      if (adjacency[u][v] > 0) continue;
      let pred = 0;
      for (let f = 0; f < k; f) {
        pred = P[u][f] * Q[v][f];
      }
      predictions.push({ from: users[u], to: users[v], score: pred });
    }
  }
  predictions.sort((a, b) => b.score - a.score);
  return predictions;
}

