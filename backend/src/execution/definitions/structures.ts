export interface StructureDefinition {
    name?: string; // Optional, legacy
    classCode?: string; // Optional, legacy
    helpersCode?: string; // Optional, legacy
    definition: string;
    hydrationHelper: string;
    dehydrationHelper: string;
}

export const STRUCTURE_DEFINITIONS: Record<string, StructureDefinition> = {
    ListNode: {
        definition: `
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
`,
        hydrationHelper: `
function __createListNode(arr) {
    if (!arr || arr.length === 0) return null;
    let head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}
`,
        dehydrationHelper: `
function __listNodeToArray(head) {
    const result = [];
    const visited = new Set();
    let current = head;
    // Detect cycles to prevent infinite loop
    while (current && !visited.has(current)) {
        visited.add(current);
        result.push(current.val);
        current = current.next;
    }
    return result;
}
`
    },
    TreeNode: {
        definition: `
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}
`,
        hydrationHelper: `
function __createTreeNode(arr) {
    if (!arr || arr.length === 0) return null;
    let root = new TreeNode(arr[0]);
    let queue = [root];
    let i = 1;
    while (i < arr.length) {
        let current = queue.shift();
        if (arr[i] !== null) {
            current.left = new TreeNode(arr[i]);
            queue.push(current.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            current.right = new TreeNode(arr[i]);
            queue.push(current.right);
        }
        i++;
    }
    return root;
}
`,
        dehydrationHelper: `
function __treeNodeToArray(root) {
    if (!root) return [];
    const result = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            result.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            result.push(null);
        }
    }
    // Remove trailing nulls
    while (result.length > 0 && result[result.length - 1] === null) {
        result.pop();
    }
    return result;
}
`
    },
    GraphNode: {
        definition: `
function Node(val, neighbors) {
    this.val = val === undefined ? 0 : val;
    this.neighbors = neighbors === undefined ? [] : neighbors;
}
`,
        hydrationHelper: `
function __createGraphNode(adjList) {
    if (!adjList || adjList.length === 0) return null;
    
    // Create all nodes first (1-indexed based on index in adjList + 1)
    const nodes = new Map();
    for (let i = 0; i < adjList.length; i++) {
        nodes.set(i + 1, new Node(i + 1));
    }
    
    // Connect neighbors
    for (let i = 0; i < adjList.length; i++) {
        const node = nodes.get(i + 1);
        const neighbors = adjList[i];
        for (const neighborVal of neighbors) {
            node.neighbors.push(nodes.get(neighborVal));
        }
    }
    
    return nodes.get(1); // Return node 1
}
`,
        dehydrationHelper: `
function __graphNodeToArray(node) {
    if (!node) return [];
    
    const visited = new Map(); // val -> Node
    const queue = [node];
    visited.set(node.val, node);
    
    // BFS to find all nodes
    while (queue.length > 0) {
        const n = queue.shift();
        for (const neighbor of n.neighbors) {
            if (!visited.has(neighbor.val)) {
                visited.set(neighbor.val, neighbor);
                queue.push(neighbor);
            }
        }
    }
    
    // Create adjacency list
    // Assuming nodes are 1-indexed and contiguous 1..N
    const keys = Array.from(visited.keys()).sort((a, b) => a - b);
    if (keys.length === 0) return [];
    
    const maxVal = keys[keys.length - 1];
    const result = new Array(maxVal).fill(0).map(() => []);
    
    for (let i = 1; i <= maxVal; i++) {
        const n = visited.get(i);
        if (n) {
            result[i - 1] = n.neighbors.map(neighbor => neighbor.val);
        }
    }
    
    return result;
}
`
    },
    RandomListNode: {
        definition: `
function Node(val, next, random) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
    this.random = random === undefined ? null : random;
}
`,
        hydrationHelper: `
function __createRandomListNode(arr) {
    if (!arr || arr.length === 0) return null;
    
    // Create all nodes
    const nodes = arr.map(item => new Node(item[0]));
    
    // Link next and random pointers
    for (let i = 0; i < nodes.length; i++) {
        if (i < nodes.length - 1) {
            nodes[i].next = nodes[i + 1];
        }
        
        const randomIndex = arr[i][1];
        if (randomIndex !== null && randomIndex !== undefined) {
            nodes[i].random = nodes[randomIndex];
        }
    }
    
    return nodes[0];
}
`,
        dehydrationHelper: `
function __randomListNodeToArray(head) {
    if (!head) return [];
    
    // Map nodes to indices
    const nodeToIndex = new Map();
    let current = head;
    let index = 0;
    while (current) {
        nodeToIndex.set(current, index);
        current = current.next;
        index++;
    }
    
    // Build result array
    const result = [];
    current = head;
    while (current) {
        const randomIdx = current.random ? nodeToIndex.get(current.random) : null;
        result.push([current.val, randomIdx === undefined ? null : randomIdx]);
        current = current.next;
    }
    
    return result;
}
`
    },
    // N-ary Tree Node (used in N-ary Tree problems)
    NaryNode: {
        definition: `
function NaryNode(val, children) {
    this.val = val === undefined ? 0 : val;
    this.children = children === undefined ? [] : children;
}
`,
        hydrationHelper: `
function __createNaryNode(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;
    
    const root = new NaryNode(arr[0]);
    const queue = [root];
    let i = 2; // Skip first value and first null separator
    
    while (i < arr.length && queue.length > 0) {
        const parent = queue.shift();
        while (i < arr.length && arr[i] !== null) {
            const child = new NaryNode(arr[i]);
            parent.children.push(child);
            queue.push(child);
            i++;
        }
        i++; // Skip the null separator
    }
    
    return root;
}
`,
        dehydrationHelper: `
function __naryNodeToArray(root) {
    if (!root) return [];
    
    const result = [root.val, null];
    const queue = [root];
    
    while (queue.length > 0) {
        const node = queue.shift();
        for (const child of node.children) {
            result.push(child.val);
            queue.push(child);
        }
        result.push(null);
    }
    
    // Remove trailing nulls
    while (result.length > 0 && result[result.length - 1] === null) {
        result.pop();
    }
    
    return result;
}
`
    },
    // Doubly Linked List Node (for LRU Cache internal, Flatten Multilevel DLL)
    DoublyListNode: {
        definition: `
function DoublyListNode(val, prev, next, child) {
    this.val = val === undefined ? 0 : val;
    this.prev = prev === undefined ? null : prev;
    this.next = next === undefined ? null : next;
    this.child = child === undefined ? null : child;
}
`,
        hydrationHelper: `
function __createDoublyListNode(arr) {
    if (!arr || arr.length === 0) return null;
    let head = new DoublyListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] !== null) {
            const newNode = new DoublyListNode(arr[i]);
            current.next = newNode;
            newNode.prev = current;
            current = newNode;
        }
    }
    return head;
}
`,
        dehydrationHelper: `
function __doublyListNodeToArray(head) {
    const result = [];
    const visited = new Set();
    let current = head;
    while (current && !visited.has(current)) {
        visited.add(current);
        result.push(current.val);
        current = current.next;
    }
    return result;
}
`
    },
    // NestedInteger (for Flatten Nested List Iterator, Nested List Weight Sum)
    NestedInteger: {
        definition: `
function NestedInteger(value) {
    this._integer = null;
    this._list = [];
    if (value !== undefined) {
        if (typeof value === 'number') {
            this._integer = value;
        } else if (Array.isArray(value)) {
            this._list = value.map(v => new NestedInteger(v));
        }
    }
}
NestedInteger.prototype.isInteger = function() {
    return this._integer !== null;
};
NestedInteger.prototype.getInteger = function() {
    return this._integer;
};
NestedInteger.prototype.setInteger = function(value) {
    this._integer = value;
    this._list = [];
};
NestedInteger.prototype.add = function(elem) {
    this._integer = null;
    this._list.push(elem);
};
NestedInteger.prototype.getList = function() {
    return this._list;
};
`,
        hydrationHelper: `
function __createNestedInteger(arr) {
    if (typeof arr === 'number') {
        return new NestedInteger(arr);
    }
    if (Array.isArray(arr)) {
        const ni = new NestedInteger();
        for (const item of arr) {
            ni.add(__createNestedInteger(item));
        }
        return ni;
    }
    return new NestedInteger();
}
`,
        dehydrationHelper: `
function __nestedIntegerToArray(ni) {
    if (!ni) return null;
    if (ni.isInteger()) {
        return ni.getInteger();
    }
    return ni.getList().map(item => __nestedIntegerToArray(item));
}
`
    }
};

export const GENERIC_HELPERS = {
    hydrate: `
function __hydrate(value, type) {
    if (value === null || value === undefined) return value;
    if (type.endsWith('[]')) {
        const baseType = type.slice(0, -2);
        if (!Array.isArray(value)) return [];
        return value.map(item => __hydrate(item, baseType));
    }
    switch (type) {
        case 'ListNode': return __createListNode(value);
        case 'TreeNode': return __createTreeNode(value);
        case 'GraphNode': return __createGraphNode(value);
        case 'RandomListNode': return __createRandomListNode(value);
        case 'NaryNode': return __createNaryNode(value);
        case 'DoublyListNode': return __createDoublyListNode(value);
        case 'NestedInteger': return __createNestedInteger(value);
        default: return value;
    }
}
`,
    dehydrate: `
function __dehydrate(value, type) {
    if (value === null || value === undefined) return value;
    if (type.endsWith('[]')) {
        const baseType = type.slice(0, -2);
        if (!Array.isArray(value)) return [];
        return value.map(item => __dehydrate(item, baseType));
    }
    switch (type) {
        case 'ListNode': return __listNodeToArray(value);
        case 'TreeNode': return __treeNodeToArray(value);
        case 'GraphNode': return __graphNodeToArray(value);
        case 'RandomListNode': return __randomListNodeToArray(value);
        case 'NaryNode': return __naryNodeToArray(value);
        case 'DoublyListNode': return __doublyListNodeToArray(value);
        case 'NestedInteger': return __nestedIntegerToArray(value);
        default: return value;
    }
}
`
};
