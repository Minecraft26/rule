document.addEventListener('DOMContentLoaded', () => {
    const rulesConfig = {
        "necessary-rules": { title: "Necessary Rules", idPrefix: "SR-N", json: "server-rules/necessary.json" },
        "optional-rules": { title: "Optional Rules", idPrefix: "SR-O", json: "server-rules/optional.json" },
        "law-like-rules": { title: "Law-Like Rules", idPrefix: "SR-L", json: "server-rules/law.json" },
        "rights-duties-rules": { title: "Rights & Duties", idPrefix: "SR-RD", json: "server-rules/rights-duties.json" },
        "economy-rules": { title: "Economy", idPrefix: "SR-E", json: "server-rules/economy.json" },
        "jobs-rules": { title: "Jobs", idPrefix: "SR-J", json: "server-rules/jobs.json" },
        "judiciary-rules": { title: "Judiciary", idPrefix: "GR-JU", json: "government-rules/judiciary.json" },
        "govt-leader-rules": { title: "Government Leader", idPrefix: "GR-GL", json: "government-rules/govt-leader.json" },
        "lawyer-rules": { title: "Lawyer", idPrefix: "GR-LA", json: "government-rules/lawyer.json" },
        "police-rules": { title: "Police", idPrefix: "GR-P", json: "government-rules/police.json" },
        "finance-rules": { title: "Finance", idPrefix: "GR-F", json: "government-rules/finance.json" }
    };

    const fetchRules = async (id) => {
        const config = rulesConfig[id];
        if (!config) {
            console.error(`Error: No configuration found for ID: ${id}`);
            return null;
        }
        try {
            const response = await fetch(config.json);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Check if the data is in the expected 'groups' format or the 'law.json' format
            if (data && Array.isArray(data)) {
                let ruleCounter = 1;
                return data.map(group => {
                    const newRules = (group.rules || group.content || []).map(rule => {
                        // Dynamically assign code and page, handling the different structures
                        const code = `${config.idPrefix}${ruleCounter}`;
                        ruleCounter++;
                        const page = Math.ceil(ruleCounter / 20); // Example logic for pagination
                        return { ...rule, code, page };
                    });
                    // Return a consistent structure
                    return { title: group.title, rules: newRules };
                });
            } else {
                console.error("Fetched data is not an array:", data);
                return null;
            }
        } catch (error) {
            console.error("Could not fetch rules:", error);
            return null;
        }
    };
    

    // Get all necessary DOM elements
    const mainSelection = document.getElementById('main-selection');
    const serverRulesSelection = document.getElementById('server-rules-selection');
    const govtRulesSelection = document.getElementById('govt-rules-selection');
    const rulesPageView = document.getElementById('rules-page-view');
    const dynamicRulesContent = document.getElementById('dynamic-rules-content');
    const localSearchBox = document.getElementById('local-search-box');
    const localSearchButton = document.getElementById('local-search-button');
    const controlsContainer = document.getElementById('controls-container');
    const paginationButtonsContainerTop = document.getElementById('pagination-buttons-top');
    const paginationButtonsContainerBottom = document.getElementById('pagination-buttons-bottom');
    const backButtons = document.querySelectorAll('.back-button');
    const subCategoryBoxes = document.querySelectorAll('#server-rules-selection .rules-box, #govt-rules-selection .rules-box');

    let currentCategoryId = '';
    let currentPage = 1;
    let totalPages = 1;
    let currentCategoryData = null;
    let currentMainCategory = ''; // Added

    // Function to generate and display rule items for the current page
    function renderRulesForPage(groupsData) { // Changed parameter name to groupsData
        dynamicRulesContent.innerHTML = '';
        if (!groupsData || !Array.isArray(groupsData)) {
            dynamicRulesContent.innerHTML = `<p class="error-message">Invalid rule data for this category (expected an array of groups).</p>`;
            return;
        }

        let rulesToRender = [];
        groupsData.forEach(group => {
            if (group.rules && Array.isArray(group.rules)) {
                rulesToRender = rulesToRender.concat(group.rules.filter(rule => rule.page === currentPage));
            }
        });
        
        if (rulesToRender.length === 0) {
            dynamicRulesContent.innerHTML = `<p class="error-message">No rules found for this page.</p>`;
            return;
        }

        // Create and append a header for the category (using the first group's title for simplicity, or you can adjust)
        const header = document.createElement('div');
        header.innerHTML = `<h2 class="rules-header">Page ${currentPage} of ${totalPages} - ${groupsData[0].title}</h2>`; // Using first group's title
        dynamicRulesContent.appendChild(header);

        // Create and append each rule item
        rulesToRender.forEach(rule => {
            const ruleItem = document.createElement('div');
            ruleItem.classList.add('rule-item', 'transition-all', 'duration-300', 'transform', 'hover:scale-101');
            ruleItem.innerHTML = `
                <div class="rule-item-header">
                    <div>
                        <span class="text-xl font-bold text-blue-600">${rule.code}</span>
                        <span class="ml-4 text-lg font-semibold text-gray-800">${rule.shortDescription}</span>
                        <span class="ml-4 text-sm text-gray-500">(Page: ${rule.page})</span>
                    </div>
                    <span class="arrow-container">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </span>
                </div>
                <div class="rule-description">
                    <p>${rule.longDescription}</p>
                </div>
            `;
            // Add accordion-like click event
            ruleItem.addEventListener('click', () => {
                ruleItem.classList.toggle('active');
            });
            dynamicRulesContent.appendChild(ruleItem);
        });
        updatePaginationButtons();
    }

    // Function to update the page navigation buttons
    function updatePaginationButtons() {
        const containers = [paginationButtonsContainerTop, paginationButtonsContainerBottom];
        
        containers.forEach(container => {
            if (!container) return;
            container.innerHTML = ''; // Clear existing buttons
            
            if (totalPages > 1) {
                const prevButton = document.createElement('button');
                prevButton.textContent = '← Prev';
                prevButton.classList.add('page-button', 'rounded-md', currentPage === 1 ? 'inactive' : 'active');
                prevButton.disabled = currentPage === 1;
                prevButton.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderRulesForPage(currentCategoryData);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });

                const nextButton = document.createElement('button');
                nextButton.textContent = 'Next →';
                nextButton.classList.add('page-button', 'rounded-md', currentPage === totalPages ? 'inactive' : 'active');
                nextButton.disabled = currentPage === totalPages;
                nextButton.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderRulesForPage(currentCategoryData);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });

                container.appendChild(prevButton);
                container.appendChild(nextButton);
            }
        });
    }

    // Handle main category button clicks (Server Rules, Government Rules)
    document.querySelector('.server-rules-main').addEventListener('click', () => {
        mainSelection.classList.add('hidden');
        serverRulesSelection.classList.remove('hidden');
    });
    document.querySelector('.govt-rules-main').addEventListener('click', () => {
        mainSelection.classList.add('hidden');
        govtRulesSelection.classList.remove('hidden');
    });

    subCategoryBoxes.forEach(box => {
        box.addEventListener('click', async () => { // Added async
            const targetId = box.dataset.target;
            const category = box.dataset.category;
            
            if (category === 'Server Rules') {
                serverRulesSelection.classList.add('hidden');
            } else if (category === 'Government Rules') {
                govtRulesSelection.classList.add('hidden');
            }
            
            currentCategoryId = targetId;
            currentMainCategory = category; // Store the main category
            controlsContainer.classList.add('hidden'); // Hide controls while loading
            rulesPageView.classList.add('hidden'); // Hide rules view while loading
            dynamicRulesContent.innerHTML = '<p class="loading">Loading rules...</p>'; // Show loading message

            const fetchedData = await fetchRules(targetId); // Fetch data

            if (fetchedData && Array.isArray(fetchedData)) { // Check if fetchedData is an array
                currentCategoryData = fetchedData; // Store the array of groups
                // Calculate totalPages based on all rules across all groups
                const allRules = fetchedData.flatMap(group => group.rules || []);
                const pageNumbers = new Set(allRules.map(rule => rule.page));
                totalPages = pageNumbers.size;
                currentPage = 1;
                renderRulesForPage(currentCategoryData); // Pass the array of groups
                controlsContainer.classList.remove('hidden');
                rulesPageView.classList.remove('hidden');
            } else {
                dynamicRulesContent.innerHTML = `<p class="error-message">Failed to load rules for this category. The JSON file might be missing, have an incorrect structure (expected an array of rule groups), or contain no rules.</p>`;
                rulesPageView.classList.remove('hidden');
                controlsContainer.classList.remove('hidden');
            }
            localSearchBox.value = ''; // Clear search box on new category selection
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
        });
    });

    // Handle back button clicks
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            localSearchBox.value = ''; // Clear search box on back button
            if (target === 'main-selection') {
                serverRulesSelection.classList.add('hidden');
                govtRulesSelection.classList.add('hidden');
                rulesPageView.classList.add('hidden');
                mainSelection.classList.remove('hidden');
                controlsContainer.classList.add('hidden');
            } else if (target === 'back-to-sub-menu') {
                rulesPageView.classList.add('hidden');
                controlsContainer.classList.add('hidden');
                const isServerRule = currentMainCategory === 'Server Rules';
                if (isServerRule) {
                    serverRulesSelection.classList.remove('hidden');
                } else {
                    govtRulesSelection.classList.remove('hidden');
                }
                dynamicRulesContent.innerHTML = '';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Handle search functionality
    function performLocalSearch() {
        const query = localSearchBox.value.toLowerCase().trim();
        if (query === '') {
            // Go back to the main category view if search is empty
            rulesPageView.classList.add('hidden');
            serverRulesSelection.classList.add('hidden');
            govtRulesSelection.classList.add('hidden');
            mainSelection.classList.remove('hidden');
            controlsContainer.classList.add('hidden');
            return;
        }

        // Filter rules based on the search query across all groups in the current category
        const searchResults = currentCategoryData.flatMap(group =>
            (group.rules || []).filter(rule =>
                rule.shortDescription.toLowerCase().includes(query) ||
                rule.longDescription.toLowerCase().includes(query) ||
                (rule.code && rule.code.toLowerCase().includes(query)) // Add a check for the code
            )
        );
        
        // Display results and hide all category selections
        serverRulesSelection.classList.add('hidden');
        govtRulesSelection.classList.add('hidden');
        mainSelection.classList.add('hidden');
        rulesPageView.classList.remove('hidden');
        controlsContainer.classList.remove('hidden');

        dynamicRulesContent.innerHTML = '';
        if (searchResults.length === 0) {
            dynamicRulesContent.innerHTML = `<p class="error-message">No rules found for "${query}".</p>`;
            return;
        }

        // Display search results
        searchResults.forEach(rule => {
            const ruleItem = document.createElement('div');
            ruleItem.classList.add('rule-item', 'transition-all', 'duration-300', 'transform', 'hover:scale-101');
            ruleItem.innerHTML = `
                    <div class="rule-item-header">
                        <div>
                            <span class="text-xl font-bold text-blue-600">${rule.code}</span>
                            <span class="ml-4 text-lg font-semibold text-gray-800">${rule.shortDescription}</span>
                            <span class="ml-4 text-sm text-gray-500">(Page: ${rule.page})</span>
                        </div>
                        <span class="arrow-container">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    </div>
                    <div class="rule-description">
                        <p>${rule.longDescription}</p>
                    </div>
                `;
            // Add accordion-like click event
            ruleItem.addEventListener('click', () => {
                ruleItem.classList.toggle('active');
            });
            dynamicRulesContent.appendChild(ruleItem);
        });
        paginationButtonsContainerTop.innerHTML = ''; // Hide pagination for search results
        paginationButtonsContainerBottom.innerHTML = ''; // Hide pagination for search results
    }

    localSearchButton.addEventListener('click', performLocalSearch);
    localSearchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performLocalSearch();
        }
    });
});
