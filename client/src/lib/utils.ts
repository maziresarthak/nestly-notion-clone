import type { PageTreeItem } from '../api/pages';

export interface TreeNode {
  page: PageTreeItem;
  children: TreeNode[];
}

/**
 * Build a nested tree from a flat list of pages.
 * O(n) using a Map. Children sorted by sortOrder.
 */
export function buildTree(pages: PageTreeItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const page of pages) {
    map.set(page.id, { page, children: [] });
  }

  // Build tree
  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by sortOrder
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => a.page.sortOrder.localeCompare(b.page.sortOrder));
    for (const node of nodes) {
      sortChildren(node.children);
    }
  }
  sortChildren(roots);

  return roots;
}

/**
 * Flatten a tree to a list of { node, depth } for rendering.
 * Respects expandedIds — only includes children of expanded nodes.
 */
export function flattenTree(
  roots: TreeNode[],
  expandedIds: Set<string>
): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = [];

  function walk(nodes: TreeNode[], depth: number) {
    for (const node of nodes) {
      result.push({ node, depth });
      if (node.children.length > 0 && expandedIds.has(node.page.id)) {
        walk(node.children, depth + 1);
      }
    }
  }

  walk(roots, 0);
  return result;
}

/**
 * Get all descendant IDs of a page (for DnD cycle prevention).
 */
export function getDescendantIds(pageId: string, pages: PageTreeItem[]): Set<string> {
  const ids = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  for (const p of pages) {
    if (p.parentId) {
      if (!childrenMap.has(p.parentId)) childrenMap.set(p.parentId, []);
      childrenMap.get(p.parentId)!.push(p.id);
    }
  }

  function collect(id: string) {
    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      ids.add(childId);
      collect(childId);
    }
  }

  collect(pageId);
  return ids;
}
