---
title: Minimum cost multi-commodity transshipment
tags: Graph
---

# Problem
Let $D=(V,A)$. $l_i,u: A\to \R^+$, $c_i:A\to \R$, $b_i:V\to \R$ for all $1\leq i\leq n$. We want to find a sequence of flow function $f_i$, such that:

\begin{align}
\text{Minimize:} & \sum_{a \in A} c_i(a)f_i(a) \\
\text{subject to:} & f(a) = \sum_{i} f_i(a) \text{ for } 1 \le i \le n, \\
& \sum_{a \in \delta^+(v)} f_i(a) - \sum_{a \in \delta^-(v)} f_i(a) = b_i(v) \text{ for } 1 \le i \le n, v \in V, \\
& l_i(a) \leq f_i(a) \text{ for } 1 \le i \le n, a\in A\\
& f(a) \leq u(a) \text{ for } a\in A\\
\end{align}

# Algorithms

