import { Category } from "~/lib/queries/categories";

export interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

/**
 * Builds a hierarchical tree structure from a flat list of categories
 * @param categories Flat list of categories from API
 * @returns Root-level categories with their subcategories nested
 */
export function buildCategoryHierarchy(categories: Category[]): CategoryNode[] {
  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryNode>();

  // Initialize all categories as nodes
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      level: 0,
    });
  });

  // Build the hierarchy
  const roots: CategoryNode[] = [];

  categoryMap.forEach((node, id) => {
    if (node.parentId) {
      const parent = categoryMap.get(node.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      }
    } else {
      // Root level category
      node.level = 0;
      roots.push(node);
    }
  });

  // Sort roots by name
  roots.sort((a, b) => a.name.localeCompare(b.name));

  // Recursively sort children
  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.forEach((node) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      sortChildren(node.children);
    });
  };

  sortChildren(roots);

  return roots;
}

/**
 * Flattens the category hierarchy into a list with indentation info
 * Useful for displaying in dropdowns or lists
 */
export function flattenCategoryHierarchy(
  nodes: CategoryNode[],
  flat: Array<CategoryNode & { displayName: string }> = []
): Array<CategoryNode & { displayName: string }> {
  nodes.forEach((node) => {
    const indent = "—".repeat(node.level);
    const displayName = node.level > 0 ? `${indent} ${node.name}` : node.name;

    flat.push({
      ...node,
      displayName,
    });

    if (node.children.length > 0) {
      flattenCategoryHierarchy(node.children, flat);
    }
  });

  return flat;
}

/**
 * Gets all leaf categories (categories with no children)
 * Use this if you want products assigned only to leaf categories
 */
export function getLeafCategories(nodes: CategoryNode[]): CategoryNode[] {
  const leaves: CategoryNode[] = [];

  const traverse = (node: CategoryNode) => {
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return leaves;
}

/**
 * Gets all categories at a specific level
 * Useful for filtering by depth
 */
export function getCategoriesByLevel(
  nodes: CategoryNode[],
  level: number
): CategoryNode[] {
  const result: CategoryNode[] = [];

  const traverse = (node: CategoryNode) => {
    if (node.level === level) {
      result.push(node);
    }
    node.children.forEach(traverse);
  };

  nodes.forEach(traverse);
  return result;
}
