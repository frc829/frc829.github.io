const tree = document.getElementById('tree');

            function toggle(node, expanded) {
                const isLeaf = node.classList.contains('leaf');
                if (isLeaf) return;
                if (expanded == null) node.classList.toggle('expanded');
                else node.classList.toggle('expanded', !!expanded);
                node.setAttribute('aria-expanded', node.classList.contains('expanded'));
            }

            tree.addEventListener('click', (e) => {
                const label = e.target.closest('.label');
                if (!label) return;
                const node = label.parentElement;
                toggle(node);
            });

            tree.addEventListener('keydown', (e) => {
                const node = e.target.closest('[role="treeitem"]');
                if (!node) return;
                const key = e.key;
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    toggle(node);
                } else if (key === 'ArrowRight') {
                    e.preventDefault();
                    toggle(node, true);
                } else if (key === 'ArrowLeft') {
                    e.preventDefault();
                    toggle(node, false);
                } else if (key === 'ArrowDown' || key === 'ArrowUp') {
                    e.preventDefault();
                    const items = [...tree.querySelectorAll('[role="treeitem"]')].filter(el => el.offsetParent !== null);
                    const i = items.indexOf(node);
                    const j = key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
                    items[j].focus();
                }
            });

            // Expand/Collapse All
            const expandAllBtn = document.getElementById('expandAll');
            const collapseAllBtn = document.getElementById('collapseAll');
            const resetBtn = document.getElementById('reset');

            function expandAll() {
                tree.querySelectorAll('.node').forEach(n => {
                    if (!n.classList.contains('leaf')) toggle(n, true);
                });
            }

            function collapseAll() {
                const root = tree.querySelector('.node');
                tree.querySelectorAll('.node').forEach(n => {
                    if (n !== root && !n.classList.contains('leaf')) toggle(n, false);
                });
                toggle(root, true);
            }

            expandAllBtn.addEventListener('click', expandAll);
            collapseAllBtn.addEventListener('click', collapseAll);

            // FILTERING SEARCH
            const search = document.getElementById('search');

            function clearMatches() {
                tree.querySelectorAll('.label.match').forEach(el => el.classList.remove('match'));
                tree.querySelectorAll('.node').forEach(n => n.style.display = '');
            }

            function labelText(node) {
                const label = node.querySelector(':scope > .label');
                if (!label) return '';
                return Array.from(label.querySelectorAll('.path, .meta'))
                    .map(e => e.textContent).join(' ');
            }

            function applyFilter(q) {
                const nodes = Array.from(tree.querySelectorAll('.node'));
                const lcq = q.trim().toLowerCase();

                // reset
                clearMatches();

                if (!lcq) {
                    // show everything and expand all for convenience
                    expandAll();
                    return;
                }

                // mark matches at node level and hide non-matching branches
                nodes.forEach(n => {
                    const text = labelText(n).toLowerCase();
                    const isMatch = text.includes(lcq);
                    const label = n.querySelector(':scope > .label');
                    if (isMatch && label) label.classList.add('match');
                    n.dataset.selfMatch = isMatch ? '1' : '0';
                });

                // compute visibility: visible if self-match OR any descendant is self-match
                nodes.forEach(n => {
                    const hasDescendantMatch = n.querySelector('.node[data-self-match="1"]') !== null;
                    const isSelfMatch = n.dataset.selfMatch === '1';
                    const visible = isSelfMatch || hasDescendantMatch;
                    n.style.display = visible ? '' : 'none';

                    // expand nodes that lead to matches; collapse others for clarity
                    if (visible && !n.classList.contains('leaf')) {
                        // expand if descendant match exists (to reveal it)
                        toggle(n, hasDescendantMatch);
                    }
                });

                // ensure that every matching node and its ancestors are expanded
                nodes.filter(n => n.dataset.selfMatch === '1').forEach(n => {
                    let p = n.parentElement.closest('.node');
                    while (p) {
                        toggle(p, true);
                        p.style.display = '';
                        p = p.parentElement.closest('.node');
                    }
                });
            }

            search.addEventListener('input', () => applyFilter(search.value));

            resetBtn.addEventListener('click', () => {
                search.value = '';
                clearMatches();
                expandAll();
            });

            // initial state
            expandAll();