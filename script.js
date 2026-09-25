let lists = JSON.parse(localStorage.getItem('universal_packer_storage')) || [];
    let categoryPresets = JSON.parse(localStorage.getItem('universal_packer_presets')) || [];
    let activeListId = null;
    let currentEditPresetIdx = null;
    let emojiPickerTarget = {type: 'category', catIdx: null, presetIdx: null};
    let dragSource = {type: null, index: null, parentIdx: null, grandParentIdx: null};
    let editorLayout = localStorage.getItem('universal_packer_layout') || 'normal';

    let isEditingDates = false;

    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    function toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        lucide.createIcons();
    }

    const TRAVEL_EMOJIS = ['ðŸ“', 'ðŸ‘•', 'ðŸ”‹', 'ðŸª¥', 'ðŸ“·', 'ðŸ›‚', 'ðŸŽŸï¸', 'ðŸ’Š', 'ðŸŽ’', 'ðŸ¥¾', 'ðŸŒ‚', 'â›º', 'ðŸ”¦', 'ðŸ—ºï¸', 'ðŸ•¶ï¸', 'ðŸ’»', 'ðŸŽ§', 'ðŸ”Œ', 'âš¡', 'ðŸ’µ', 'ðŸ’³', 'ðŸ“¸', 'ðŸ“¦', 'ðŸš†', 'ðŸš¿'];

    // Initial Presets basierend auf deinen echten Schottland-Daten
    if(categoryPresets.length === 0) {
        categoryPresets = [
            {
                name: "Kameragear Pro", emoji: "ðŸ“¸",
                items: [
                    { text: "Kamerabody", amount: 1, checked: false, subItems: [] },
                    { text: "Objektive", amount: 1, checked: false, subItems: [{text: "Standard", amount: 1, checked: false}] },
                    { text: "Teleobjektiv", amount: 1, checked: false, subItems: [] },
                    { text: "Weitwinkel", amount: 1, checked: false, subItems: [] },
                    { text: "Akkus", amount: 3, checked: false, subItems: [] },
                    { text: "Speicherkarten", amount: 2, checked: false, subItems: [] },
                    { text: "Reinigungsset", amount: 1, checked: false }
                ]
            },
            {
                name: "Basis Dokumente", emoji: "ðŸ’³",
                items: [
                    { text: "Reisepass", amount: 1, checked: false },
                    {
                        text: "Geldbeutel", amount: 1, checked: false,
                        subItems: [
                            {text: "Ausweis", amount: 1},
                            {text: "FÃ¼hrerschein", amount: 1},
                            {text: "Versicherungskarte", amount: 1},
                            {text: "PolyGo Karte", amount: 1},
                            {text: "Studentenausweis", amount: 1},
                            {text: "Bargeld", amount: 1}
                        ]
                    }
                ]
            }
        ];
        save();
    }

    const BASE_CATEGORIES = [
        {
            name: "Dokumente", emoji: "ðŸ’³", collapsed: false,
            items: [
                { text: "Reisepass", amount: 1, checked: false },
                {
                    text: "Geldbeutel", amount: 1, checked: false,
                    subItems: [
                        { text: "Ausweis", amount: 1, checked: false },
                        { text: "FÃ¼hrerschein", amount: 1, checked: false },
                        { text: "PolyGo Karte", amount: 1 },
                        { text: "Studentenausweis", amount: 1 },
                        { text: "Bargeld", amount: 1, checked: false }
                    ]
                }
            ]
        },
        {
            name: "Kleidung", emoji: "ðŸ‘•", collapsed: false,
            items: [
                { text: "T-Shirts", amount: 5, checked: false },
                { text: "UnterwÃ¤sche", amount: 5, checked: false },
                { text: "Socken", amount: 5, checked: false },
                { text: "Pullis", amount: 2 },
                { text: "Jacke", amount: 1 }
            ]
        }
    ];

    const TEMPLATES = {
        city: { name: "StÃ¤dtetrip", icon: "building-2", color: "#4f46e5", categories: JSON.parse(JSON.stringify(BASE_CATEGORIES)) },
        outdoor: { name: "Outdoor", icon: "mountain", color: "#078537", categories: JSON.parse(JSON.stringify(BASE_CATEGORIES)) },
        photography: {
            name: "Foto Tour", icon: "camera", color: "#d97706",
            categories: [...JSON.parse(JSON.stringify(BASE_CATEGORIES)), JSON.parse(JSON.stringify(categoryPresets[0]))]
        },
        empty: { name: "Neue Reise", icon: "briefcase", color: "#64748b", categories: [{ name: "Allgemein", emoji: "ðŸ“¦", collapsed: false, items: [] }] }
    };

    function renderDashboard() {
        const dashboard = document.getElementById('dashboard');
        dashboard.innerHTML = '';
        if (lists.length === 0) {
            dashboard.innerHTML = `<div class="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300"><h3 class="text-2xl font-bold dark:text-white">Wohin geht's als nÃ¤chstes?</h3></div>`;
        } else {
            lists.forEach(list => {
                const total = list.categories.reduce((acc, cat) => acc + (cat.items || []).length, 0);
                const checked = list.categories.reduce((acc, cat) => acc + (cat.items || []).filter(i => i.checked).length, 0);
                const progress = total === 0 ? 0 : Math.round((checked / total) * 100);
                const dateDisplay = (list.startDate || list.endDate) ? `${formatDate(list.startDate) || '?'} â€” ${formatDate(list.endDate) || '?'}` : "Zeitraum planen";

                const card = document.createElement('div');
                card.className = `list-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer relative overflow-hidden group transition-all duration-300`;
                card.onclick = () => openList(list.id);
                card.innerHTML = `
                    <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${list.color}"></div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 transition-colors duration-300"><i data-lucide="${list.icon || 'briefcase'}" style="color: ${list.color}"></i></div>
                        <button onclick="event.stopPropagation(); deleteList('${list.id}')" class="p-2 text-slate-300 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                    <h3 class="font-bold text-xl mb-1 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">${list.name}</h3>
                    <p class="text-sm text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4"></i> ${dateDisplay}</p>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-6">
                        <div class="h-full transition-all duration-700" style="width: ${progress}%; background-color: ${list.color}"></div>
                    </div>`;
                dashboard.appendChild(card);
            });
        }
        lucide.createIcons();
        save();
    }

    function openList(id) {
        activeListId = id;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('mainHeader').classList.add('hidden');
        document.getElementById('editor').classList.remove('hidden');
        renderEditor();
    }

    function showDashboard() {
        activeListId = null;
        isEditingDates = false;
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('mainHeader').classList.remove('hidden');
        document.getElementById('editor').classList.add('hidden');
        renderDashboard();
    }

    function formatDate(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
    }

    function escapeHtml(unsafe) {
        return (unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function setDateEditMode(state) {
        isEditingDates = state;
        renderEditor();
    }

    function renderEditor() {
        const list = lists.find(l => l.id === activeListId);
        if (!list) return;

        const startDisplay = list.startDate ? formatDate(list.startDate) : 'Start';
        const endDisplay = list.endDate ? formatDate(list.endDate) : 'Ende';
        const dateHasValues = list.startDate || list.endDate;

        let dateSectionHTML = '';
        if (isEditingDates) {
            dateSectionHTML = `
                <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                    <input type="date" value="${list.startDate || ''}" onchange="updateListMeta('startDate', this.value, true)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white cursor-pointer">
                    <span class="text-slate-400 font-bold">â€”</span>
                    <input type="date" value="${list.endDate || ''}" onchange="updateListMeta('endDate', this.value, true)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white cursor-pointer">
                    <button onclick="setDateEditMode(false)" class="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors shadow-sm ml-1" title="Speichern">
                        <i data-lucide="check" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
        } else {
            dateSectionHTML = `
                <button onclick="setDateEditMode(true)" class="group flex items-center gap-2.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 animate-in fade-in duration-200">
                    <i data-lucide="calendar" class="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform"></i>
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-200">
                        ${dateHasValues ? `${startDisplay} <span class="text-slate-400 font-normal mx-1">â€”</span> ${endDisplay}` : 'Reisezeitraum festlegen...'}
                    </span>
                    <i data-lucide="edit-2" class="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </button>
            `;
        }

        const header = document.getElementById('listDetailHeader');
        header.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4 flex-grow min-w-0">
                <div class="p-4 rounded-2xl shadow-inner hidden sm:block" style="background-color: ${list.color}20">
                    <i data-lucide="${list.icon || 'briefcase'}" style="color: ${list.color}" class="w-8 h-8"></i>
                </div>
                <div class="flex-grow min-w-0">
                    <input type="text" value="${escapeHtml(list.name)}" onfocus="setTimeout(() => this.select(), 10)" oninput="updateListMeta('name', this.value, false)" class="text-3xl font-black border-none bg-transparent focus:ring-0 p-0 w-full min-w-0 mb-3 dark:text-white">
                    <div class="flex flex-wrap items-center gap-3">
                         ${dateSectionHTML}
                         <div class="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                         <!-- Sexy Polished Color Picker -->
                         <div class="flex items-center gap-3 relative">
                            <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Farbe:</span>
                            <div onclick="toggleColorDropdown(event)" class="color-swatch ring-2 ring-slate-100 dark:ring-slate-800" style="background-color: ${list.color}"></div>

                            <div id="colorDropdown" class="hidden absolute top-12 left-0 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-52 glass color-dropdown">
                                <div class="grid grid-cols-5 gap-2">
                                    ${['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#64748b', '#26761b', '#0ea5e9'].map(c => `
                                        <button onclick="updateListMeta('color', '${c}')" class="color-dot ${list.color === c ? 'active' : ''}">
                                            <div class="w-full h-full rounded-full" style="background-color: ${c}"></div>
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eigene</span>
                                    <div class="custom-color-input-wrapper group hover:ring-2 ring-indigo-500 transition-all">
                                        <input type="color" value="${list.color}" onchange="updateListMeta('color', this.value)" class="hidden-picker">
                                        <div class="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-700">
                                            <i data-lucide="pipette" class="w-3 h-3 text-slate-400"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 justify-end mt-4 md:mt-0 flex-shrink-0">
                <div class="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-sm transition-colors mr-2">
                    <button onclick="setLayoutMode('min')" class="p-1.5 rounded-lg transition-colors ${editorLayout === 'min' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}" title="Kompakt (Grid)">
                        <i data-lucide="layout-grid" class="w-4 h-4"></i>
                    </button>
                    <button onclick="setLayoutMode('normal')" class="p-1.5 rounded-lg transition-colors ${editorLayout === 'normal' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}" title="Standard (Wasserfall)">
                        <i data-lucide="columns" class="w-4 h-4"></i>
                    </button>
                    <button onclick="setLayoutMode('max')" class="p-1.5 rounded-lg transition-colors ${editorLayout === 'max' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}" title="Liste (Einspaltig)">
                        <i data-lucide="list" class="w-4 h-4"></i>
                    </button>
                </div>
                <button onclick="exportList('${list.id}', 'json')" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20"><i data-lucide="download" class="w-4 h-4"></i> JSON</button>
                <button onclick="exportList('${list.id}', 'pdf')" class="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition hover:bg-rose-700 shadow-md shadow-rose-500/20"><i data-lucide="file-text" class="w-4 h-4"></i> PDF</button>
            </div>
        </div>`;

        const container = document.getElementById('categoryContainer');
        container.innerHTML = '';

        let colClass = "columns-1";
        let gapClass = "gap-6";
        if (editorLayout === 'min') { colClass = "columns-1 md:columns-2 xl:columns-3 2xl:columns-4"; gapClass = "gap-4"; }
        else if (editorLayout === 'normal') { colClass = "columns-1 lg:columns-2"; }
        else if (editorLayout === 'max') { colClass = "columns-1 lg:max-w-3xl lg:mx-auto"; }

        container.className = `${colClass} ${gapClass} items-start transition-all duration-500 w-full`;

        list.categories.forEach((cat, catIdx) => {
            const catId = `cat-card-${catIdx}`;
            const catEl = document.createElement('div');
            catEl.id = catId;
            catEl.className = "category-card bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-300";

            catEl.addEventListener('dragstart', (e) => handleDragStart(e, 'category', catIdx));
            catEl.addEventListener('dragover', (e) => handleDragOver(e, 'category', catIdx));
            catEl.addEventListener('dragleave', handleDragLeave);
            catEl.addEventListener('drop', (e) => handleDrop(e, 'category', catIdx));
            catEl.addEventListener('dragend', handleDragEnd);

            catEl.innerHTML = `
                <div class="px-5 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-2 flex-grow min-w-0">
                        <div class="grip-handle text-slate-300 dark:text-slate-600 px-1 flex-shrink-0" onmousedown="enableDrag('${catId}', true)" onmouseup="enableDrag('${catId}', false)" onmouseleave="enableDrag('${catId}', false)"><i data-lucide="grip-vertical" class="w-5 h-5"></i></div>
                        <button onclick="openEmojiPicker('category', ${catIdx})" class="text-2xl p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0">${cat.emoji || 'ðŸ“¦'}</button>
                        <input id="cat-input-${catIdx}" type="text" value="${escapeHtml(cat.name)}" onfocus="setTimeout(() => this.select(), 10)" oninput="updateCategoryName(${catIdx}, this.value, false)" class="font-bold border-none bg-transparent focus:ring-0 p-0 text-lg w-full min-w-0 dark:text-white text-ellipsis">
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button onclick="saveCategoryAsPreset(${catIdx})" class="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors" title="Als Blueprint speichern"><i data-lucide="save" class="w-5 h-5"></i></button>
                        <button onclick="toggleCollapse(${catIdx})" class="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors" title="Ein-/Ausklappen"><i data-lucide="chevron-${cat.collapsed ? 'down' : 'up'}" class="w-5 h-5"></i></button>
                        <button onclick="deleteCategory(${catIdx})" class="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors p-1.5"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                </div>
                <div class="p-3 md:p-6 space-y-4 ${cat.collapsed ? 'hidden' : ''}">
                    <div id="items-${catIdx}" class="space-y-2">
                        ${cat.items.map((item, itemIdx) => {
                const itemId = `item-row-${catIdx}-${itemIdx}`;
                const itemInputId = `input-${catIdx}-${itemIdx}`;
                return `
                            <div id="${itemId}" class="item-row overflow-hidden" ondragstart="handleDragStart(event, 'item', ${itemIdx}, ${catIdx})" ondragover="handleDragOver(event, 'item', ${itemIdx}, ${catIdx})" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'item', ${itemIdx}, ${catIdx})" ondragend="handleDragEnd(event)">
                                <div class="flex items-center gap-2 md:gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 group relative transition-colors">
                                    <div class="grip-handle text-slate-200 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onmousedown="enableDrag('${itemId}', true)" onmouseup="enableDrag('${itemId}', false)" onmouseleave="enableDrag('${itemId}', false)"><i data-lucide="grip-vertical" class="w-4 h-4"></i></div>
                                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${catIdx}, ${itemIdx})" class="flex-shrink-0">

                                    <input id="${itemInputId}" type="text" value="${escapeHtml(item.text)}" onfocus="setTimeout(() => this.select(), 10)" oninput="updateItemText(${catIdx}, ${itemIdx}, this.value, false)" class="flex-grow border-none bg-transparent focus:ring-0 p-0 font-bold dark:text-slate-100 min-w-0 text-ellipsis ${item.checked ? 'checked-item' : ''}">

                                    <div class="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 justify-end">
                                        <button onclick="addSubItem(${catIdx}, ${itemIdx})" class="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0" title="Unterliste"><i data-lucide="list-plus" class="w-4 h-4"></i></button>
                                        <div class="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 sm:px-2 py-1 rounded-xl shadow-sm w-auto justify-between transition-colors flex-shrink-0">
                                            <button onclick="updateItemAmount(${catIdx}, ${itemIdx}, -1)" class="text-slate-400 font-bold hover:text-indigo-600 transition-colors px-1">-</button>
                                            <span class="text-sm font-bold text-center w-5 sm:w-6 dark:text-slate-300">${item.amount || 1}</span>
                                            <button onclick="updateItemAmount(${catIdx}, ${itemIdx}, 1)" class="text-slate-400 font-bold hover:text-indigo-600 transition-colors px-1">+</button>
                                        </div>
                                        <button onclick="deleteItem(${catIdx}, ${itemIdx})" class="p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                    </div>
                                </div>
                                ${item.subItems && item.subItems.length > 0 ? `
                                    <div class="ml-10 md:ml-14 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-3 md:pl-4 transition-colors">
                                        ${item.subItems.map((sub, subIdx) => {
                    const subId = `sub-item-${catIdx}-${itemIdx}-${subIdx}`;
                    const subInputId = `subinput-${catIdx}-${itemIdx}-${subIdx}`;
                    return `
                                            <div id="${subId}" class="flex items-center gap-2 p-1 group/sub rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-hidden"
                                                 ondragstart="handleDragStart(event, 'subitem', ${subIdx}, ${itemIdx}, ${catIdx})"
                                                 ondragover="handleDragOver(event, 'subitem', ${subIdx}, ${itemIdx}, ${catIdx})"
                                                 ondragleave="handleDragLeave(event)"
                                                 ondrop="handleDrop(event, 'subitem', ${subIdx}, ${itemIdx}, ${catIdx})"
                                                 ondragend="handleDragEnd(event)">
                                                <div class="grip-handle text-slate-100 dark:text-slate-800 opacity-0 group-hover/sub:opacity-100 flex-shrink-0 transition-opacity" onmousedown="enableDrag('${subId}', true)" onmouseup="enableDrag('${subId}', false)" onmouseleave="enableDrag('${subId}', false)"><i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i></div>
                                                <input type="checkbox" ${sub.checked ? 'checked' : ''} onchange="toggleSubItem(${catIdx}, ${itemIdx}, ${subIdx})" class="!w-4 !h-4 flex-shrink-0">

                                                <input id="${subInputId}" type="text" value="${escapeHtml(sub.text)}" onfocus="setTimeout(() => this.select(), 10)" oninput="updateSubItemText(${catIdx}, ${itemIdx}, ${subIdx}, this.value, false)" class="flex-grow text-sm border-none bg-transparent focus:ring-0 p-0 min-w-0 text-ellipsis dark:text-slate-400 ${sub.checked ? 'checked-item' : ''}">

                                                <div class="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded-lg shadow-sm justify-between transition-colors mr-1 flex-shrink-0">
                                                    <button onclick="updateSubItemAmount(${catIdx}, ${itemIdx}, ${subIdx}, -1)" class="text-[10px] text-slate-400 font-bold px-1">-</button>
                                                    <span class="text-[10px] font-bold dark:text-slate-300 text-center w-4">${sub.amount || 1}</span>
                                                    <button onclick="updateSubItemAmount(${catIdx}, ${itemIdx}, ${subIdx}, 1)" class="text-[10px] text-slate-400 font-bold px-1">+</button>
                                                </div>

                                                <button onclick="deleteSubItem(${catIdx}, ${itemIdx}, ${subIdx})" class="opacity-0 group-hover/sub:opacity-100 text-red-400 transition-opacity p-1 flex-shrink-0"><i data-lucide="minus-circle" class="w-3.5 h-3.5"></i></button>
                                            </div>`;
                }).join('')}
                                    </div>` : ''}
                            </div>`;
            }).join('')}
                    </div>
                    <button onclick="addItem(${catIdx})" class="w-full py-3 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-800 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"><i data-lucide="plus-circle" class="w-4 h-4"></i> Item hinzufÃ¼gen</button>
                </div>`;
            container.appendChild(catEl);
        });
        lucide.createIcons();
        save();
    }

    // --- LOGIK: BLUEPRINTS ---
    function openPresetManager() {
        renderPresetList();
        document.getElementById('presetManagerModal').classList.replace('hidden', 'flex');
        lucide.createIcons();
    }

    function renderPresetList() {
        const container = document.getElementById('presetListContainer');
        container.innerHTML = '';
        categoryPresets.forEach((preset, idx) => {
            const el = document.createElement('div');
            el.className = "bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group";
            el.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <button onclick="openEmojiPicker('preset', ${idx})" class="text-2xl">${preset.emoji || 'ðŸ“¦'}</button>
                    <div class="min-w-0">
                        <input type="text" value="${preset.name}" oninput="updatePresetName(${idx}, this.value)" class="font-bold bg-transparent border-none p-0 focus:ring-0 dark:text-white w-full">
                        <p class="text-xs text-slate-400">${preset.items.length} Items im Standard</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openEditPresetItems(${idx})" class="px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-xs font-bold shadow-sm hover:text-indigo-500 transition flex items-center gap-2"><i data-lucide="edit-3" class="w-3 h-3"></i> Bearbeiten</button>
                    <button onclick="deletePreset(${idx})" class="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </div>
            `;
            container.appendChild(el);
        });
        lucide.createIcons();
    }

    function openEditPresetItems(idx) {
        currentEditPresetIdx = idx;
        const preset = categoryPresets[idx];
        const header = document.getElementById('editPresetHeader');
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-3xl">${preset.emoji}</span>
                <h3 class="text-2xl font-bold dark:text-white">Blueprint: ${preset.name}</h3>
            </div>
            <p class="text-sm text-slate-400 mt-1">Hier passt du den Standardinhalt der Vorlage an.</p>
        `;
        renderEditPresetItems();
        document.getElementById('editPresetModal').classList.replace('hidden', 'flex');
        lucide.createIcons();
    }

    function renderEditPresetItems() {
        const container = document.getElementById('editPresetItems');
        container.innerHTML = '';
        categoryPresets[currentEditPresetIdx].items.forEach((item, itemIdx) => {
            const div = document.createElement('div');
            div.className = "flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800";
            div.innerHTML = `
                <input type="text" value="${item.text}" oninput="updatePresetItemText(${itemIdx}, this.value)" class="flex-grow bg-transparent border-none focus:ring-0 p-0 font-medium dark:text-white">
                <button onclick="deletePresetItem(${itemIdx})" class="text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            `;
            container.appendChild(div);
        });
        lucide.createIcons();
    }

    function updatePresetItemText(itemIdx, val) { categoryPresets[currentEditPresetIdx].items[itemIdx].text = val; save(); }
    function deletePresetItem(itemIdx) { categoryPresets[currentEditPresetIdx].items.splice(itemIdx, 1); renderEditPresetItems(); save(); }
    function addItemToPreset() { categoryPresets[currentEditPresetIdx].items.push({text: "Neuer Eintrag", amount: 1, checked: false, subItems: []}); renderEditPresetItems(); save(); }

    function updatePresetName(idx, val) { categoryPresets[idx].name = val; save(); }
    function deletePreset(idx) { if(confirm("Diesen Blueprint wirklich lÃ¶schen?")) { categoryPresets.splice(idx, 1); renderPresetList(); save(); } }
    function createNewPreset() { categoryPresets.push({ name: "Neuer Blueprint", emoji: "ðŸ“¦", items: [] }); renderPresetList(); save(); }

    function saveCategoryAsPreset(catIdx) {
        const list = lists.find(l => l.id === activeListId);
        const cat = list.categories[catIdx];
        const newPreset = JSON.parse(JSON.stringify(cat));
        newPreset.items.forEach(i => {
            i.checked = false;
            if(i.subItems) i.subItems.forEach(s => s.checked = false);
        });
        categoryPresets.push(newPreset);
        save();
        alert('Blueprint "' + cat.name + '" wurde gespeichert!');
    }

    function openAddPresetToTripModal() {
        const grid = document.getElementById('addPresetGrid');
        grid.innerHTML = '';
        categoryPresets.forEach((preset, idx) => {
            const btn = document.createElement('button');
            btn.className = "p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 text-left transition-all flex items-center gap-4 group";
            btn.onclick = () => { addPresetToTrip(idx); closeModal('addPresetModal'); };
            btn.innerHTML = `<span class="text-3xl group-hover:scale-110 transition-transform">${preset.emoji}</span><div><h4 class="font-bold dark:text-white">${preset.name}</h4><p class="text-xs text-slate-400">${preset.items.length} GegenstÃ¤nde</p></div>`;
            grid.appendChild(btn);
        });
        document.getElementById('addPresetModal').classList.replace('hidden', 'flex');
    }

    function addPresetToTrip(idx) {
        const list = lists.find(l => l.id === activeListId);
        list.categories.push(JSON.parse(JSON.stringify(categoryPresets[idx])));
        renderEditor();
    }

    // --- COLOR PICKER LOGIC ---
    function toggleColorDropdown(event) {
        if(event) event.stopPropagation();
        const dropdown = document.getElementById('colorDropdown');
        dropdown.classList.toggle('hidden');
        lucide.createIcons();
    }

    // --- DRAG LOGIK ---
    function enableDrag(id, state) {
        const el = document.getElementById(id);
        if (el) el.setAttribute('draggable', state ? 'true' : 'false');
    }

    function handleDragStart(e, type, index, parentIdx = null, grandParentIdx = null) {
        dragSource = {type, index, parentIdx, grandParentIdx};
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            const dragEl = e.target.closest('[draggable="true"]');
            if (dragEl) dragEl.classList.add('dragging');
        }, 0);
        e.stopPropagation();
    }

    function handleDragOver(e, targetType, targetIdx, targetParentIdx = null, targetGrandParentIdx = null) {
        e.preventDefault();
        e.stopPropagation();
        if (!dragSource.type || dragSource.type !== targetType) return;

        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
        const targetEl = e.currentTarget;
        if (!targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        const isTopHalf = e.clientY < rect.top + rect.height / 2;
        if (isTopHalf) { targetEl.classList.add('drag-over-top'); } else { targetEl.classList.add('drag-over-bottom'); }
    }

    function handleDragLeave(e) { if (e.currentTarget) { e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom'); } }

    function handleDrop(e, targetType, targetIdx, targetParentIdx = null, targetGrandParentIdx = null) {
        e.stopPropagation();
        e.preventDefault();
        const targetEl = e.currentTarget;
        const isTopHalf = targetEl ? targetEl.classList.contains('drag-over-top') : true;
        document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
            el.setAttribute('draggable', 'false');
        });
        const list = lists.find(l => l.id === activeListId);
        if (!list || !dragSource.type) return;
        let finalIdx = targetIdx;
        if (!isTopHalf) finalIdx++;
        if (dragSource.type === 'category' && targetType === 'category') {
            if (dragSource.index < finalIdx) finalIdx--;
            if (dragSource.index !== finalIdx) {
                const item = list.categories.splice(dragSource.index, 1)[0];
                list.categories.splice(finalIdx, 0, item);
            }
        } else if (dragSource.type === 'item' && targetType === 'item' && dragSource.parentIdx === targetParentIdx) {
            if (dragSource.index < finalIdx) finalIdx--;
            if (dragSource.index !== finalIdx) {
                const cat = list.categories[targetParentIdx];
                const item = cat.items.splice(dragSource.index, 1)[0];
                cat.items.splice(finalIdx, 0, item);
            }
        } else if (dragSource.type === 'subitem' && targetType === 'subitem' && dragSource.grandParentIdx === targetGrandParentIdx && dragSource.parentIdx === targetParentIdx) {
            if (dragSource.index < finalIdx) finalIdx--;
            if (dragSource.index !== finalIdx) {
                const cat = list.categories[targetGrandParentIdx];
                const item = cat.items[targetParentIdx];
                const sub = item.subItems.splice(dragSource.index, 1)[0];
                item.subItems.splice(finalIdx, 0, sub);
            }
        }
        dragSource = {type: null, index: null, parentIdx: null, grandParentIdx: null};
        renderEditor();
    }

    function handleDragEnd(e) {
        document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
            el.setAttribute('draggable', 'false');
        });
        dragSource = {type: null, index: null, parentIdx: null, grandParentIdx: null};
        save();
    }

    // --- STANDARD CRUD REISE ---
    function save() {
        localStorage.setItem('universal_packer_storage', JSON.stringify(lists));
        localStorage.setItem('universal_packer_presets', JSON.stringify(categoryPresets));
    }

    function createNewList(templateKey) {
        const template = TEMPLATES[templateKey];
        const id = 'list-' + Date.now();
        lists.push({ id, ...template, startDate: "", endDate: "", created: new Date().toLocaleDateString('de-DE'), categories: JSON.parse(JSON.stringify(template.categories)) });
        closeModal('templateModal');
        openList(id);
    }

    function updateListMeta(field, value, render = true) {
        const list = lists.find(l => l.id === activeListId);
        if (list) { list[field] = value; save(); if (render) renderEditor(); }
    }

    function deleteList(id) { if (confirm("Reise wirklich lÃ¶schen?")) { lists = lists.filter(l => l.id !== id); renderDashboard(); } }
    function setLayoutMode(mode) { editorLayout = mode; localStorage.setItem('universal_packer_layout', editorLayout); renderEditor(); }
    function toggleCollapse(catIdx) { const list = lists.find(l => l.id === activeListId); if (list) { list.categories[catIdx].collapsed = !list.categories[catIdx].collapsed; save(); renderEditor(); } }

    function addNewCategory() {
        const list = lists.find(l => l.id === activeListId);
        list.categories.push({name: "Neue Kategorie", emoji: "ðŸ“¦", items: [], collapsed: false});
        const newIdx = list.categories.length - 1;
        renderEditor();
        const input = document.getElementById(`cat-input-${newIdx}`);
        if(input) { input.focus(); input.select(); }
    }

    function updateCategoryName(idx, val, render = true) { const list = lists.find(l => l.id === activeListId); list.categories[idx].name = val; save(); if (render) renderEditor(); }
    function deleteCategory(idx) { const list = lists.find(l => l.id === activeListId); list.categories.splice(idx, 1); renderEditor(); }

    function addItem(catIdx) {
        const list = lists.find(l => l.id === activeListId);
        list.categories[catIdx].items.push({text: "Neuer Eintrag", amount: 1, checked: false, subItems: []});
        const newIdx = list.categories[catIdx].items.length - 1;
        renderEditor();
        const input = document.getElementById(`input-${catIdx}-${newIdx}`);
        if(input) { input.focus(); input.select(); }
    }

    function addSubItem(catIdx, itemIdx) {
        const list = lists.find(l => l.id === activeListId);
        const item = list.categories[catIdx].items[itemIdx];
        if (!item.subItems) item.subItems = [];
        item.subItems.push({text: "Neuer Unterpunkt", amount: 1, checked: false});
        const newIdx = item.subItems.length - 1;
        renderEditor();
        const input = document.getElementById(`subinput-${catIdx}-${itemIdx}-${newIdx}`);
        if(input) { input.focus(); input.select(); }
    }

    function toggleSubItem(catIdx, itemIdx, subIdx) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items[itemIdx].subItems[subIdx].checked = !list.categories[catIdx].items[itemIdx].subItems[subIdx].checked; renderEditor(); }
    function updateSubItemText(catIdx, itemIdx, subIdx, val, render = true) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items[itemIdx].subItems[subIdx].text = val; save(); if (render) renderEditor(); }
    function updateSubItemAmount(catIdx, itemIdx, subIdx, delta) { const list = lists.find(l => l.id === activeListId); const sub = list.categories[catIdx].items[itemIdx].subItems[subIdx]; sub.amount = Math.max(1, (sub.amount || 1) + delta); renderEditor(); }
    function deleteSubItem(catIdx, itemIdx, subIdx) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items[itemIdx].subItems.splice(subIdx, 1); renderEditor(); }
    function toggleItem(catIdx, itemIdx) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items[itemIdx].checked = !list.categories[catIdx].items[itemIdx].checked; renderEditor(); }
    function updateItemText(catIdx, itemIdx, val, render = true) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items[itemIdx].text = val; save(); if (render) renderEditor(); }
    function updateItemAmount(catIdx, itemIdx, delta) { const list = lists.find(l => l.id === activeListId); const item = list.categories[catIdx].items[itemIdx]; item.amount = Math.max(1, (item.amount || 1) + delta); renderEditor(); }
    function deleteItem(catIdx, itemIdx) { const list = lists.find(l => l.id === activeListId); list.categories[catIdx].items.splice(itemIdx, 1); renderEditor(); }

    function openEmojiPicker(type, idx) {
        emojiPickerTarget = {type, idx};
        const grid = document.getElementById('emojiGrid');
        grid.innerHTML = '';
        TRAVEL_EMOJIS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = "p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-indigo-50 text-2xl transition-all hover:scale-125 hover:shadow-lg";
            btn.innerText = emoji;
            btn.onclick = () => {
                if(emojiPickerTarget.type === 'category') {
                    lists.find(l => l.id === activeListId).categories[emojiPickerTarget.idx].emoji = emoji;
                    renderEditor();
                } else {
                    categoryPresets[emojiPickerTarget.idx].emoji = emoji;
                    renderPresetList();
                    if(currentEditPresetIdx !== null) openEditPresetItems(currentEditPresetIdx);
                }
                closeModal('emojiPickerModal');
                save();
            };
            grid.appendChild(btn);
        });
        document.getElementById('emojiPickerModal').classList.remove('hidden');
        document.getElementById('emojiPickerModal').classList.add('flex');
    }

    function exportList(id, format) {
        const list = lists.find(l => l.id === id);
        if (!list) return;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(list, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${list.name}.json`; a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            exportPDF(list);
        }
    }

    function exportPDF(list) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        let y = margin;

        function checkPage(needed) {
            if (y + needed > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        }

        // Header
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(list.name, margin + 8, y + 12);
        y += 22;

        // Date line
        const startDisplay = list.startDate ? formatDate(list.startDate) : null;
        const endDisplay = list.endDate ? formatDate(list.endDate) : null;
        if (startDisplay || endDisplay) {
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.text(`${startDisplay || '?'}  —  ${endDisplay || '?'}`, margin, y + 4);
            y += 10;
        }

        // Progress
        const totalItems = list.categories.reduce((acc, cat) => acc + (cat.items || []).length, 0);
        const checkedItems = list.categories.reduce((acc, cat) => acc + (cat.items || []).filter(i => i.checked).length, 0);
        const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`${checkedItems} / ${totalItems} erledigt (${progress}%)`, margin, y + 4);
        y += 10;

        // Separator
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Categories
        list.categories.forEach((cat) => {
            checkPage(20);

            // Category header
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`${cat.emoji || '📦'}  ${cat.name}`, margin + 4, y + 7);
            y += 14;

            // Items
            (cat.items || []).forEach((item) => {
                checkPage(10);

                // Checkbox
                const boxX = margin + 4;
                const boxSize = 3.5;
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.4);
                doc.rect(boxX, y, boxSize, boxSize);
                if (item.checked) {
                    doc.setFillColor(79, 70, 229);
                    doc.rect(boxX, y, boxSize, boxSize, 'F');
                    doc.setDrawColor(255, 255, 255);
                    doc.setLineWidth(0.6);
                    doc.line(boxX + 0.7, y + 1.8, boxX + 1.4, y + 2.7);
                    doc.line(boxX + 1.4, y + 2.7, boxX + 2.8, y + 0.8);
                }

                // Item text
                doc.setFontSize(10);
                doc.setFont('helvetica', item.checked ? 'normal' : 'bold');
                doc.setTextColor(item.checked ? 148 : 51, item.checked ? 163 : 65, item.checked ? 184 : 85);
                const itemText = item.text + (item.amount > 1 ? `  ×${item.amount}` : '');
                doc.text(itemText, margin + 12, y + 3);
                y += 7;

                // Sub-items
                if (item.subItems && item.subItems.length > 0) {
                    item.subItems.forEach((sub) => {
                        checkPage(7);

                        // Sub checkbox
                        const subBoxX = margin + 14;
                        const subBoxSize = 2.8;
                        doc.setDrawColor(203, 213, 225);
                        doc.setLineWidth(0.3);
                        doc.rect(subBoxX, y, subBoxSize, subBoxSize);
                        if (sub.checked) {
                            doc.setFillColor(79, 70, 229);
                            doc.rect(subBoxX, y, subBoxSize, subBoxSize, 'F');
                        }

                        // Sub text
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(sub.checked ? 148 : 100, sub.checked ? 163 : 116, sub.checked ? 184 : 139);
                        const subText = sub.text + (sub.amount > 1 ? `  ×${sub.amount}` : '');
                        doc.text(subText, margin + 20, y + 2.5);
                        y += 5.5;
                    });
                }
            });

            y += 6;
        });

        // Footer
        checkPage(12);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text(`Universal Packer — erstellt am ${new Date().toLocaleDateString('de-DE')}`, margin, y + 2);

        doc.save(`${list.name}.pdf`);
    }

    function openTemplateModal() { document.getElementById('templateModal').classList.replace('hidden', 'flex'); lucide.createIcons(); }
    function closeModal(id) { document.getElementById(id).classList.replace('flex', 'hidden'); if(id === 'editPresetModal') currentEditPresetIdx = null; }
    function importJSON() { document.getElementById('importInput').click(); }
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); imported.id = 'list-' + Date.now(); lists.push(imported); renderDashboard(); save(); } catch(err) { console.error("Import failed"); } };
        reader.readAsText(file);
    }

    // Global Click Listener for Dropdowns
    window.addEventListener('click', (e) => {
        const dropdown = document.getElementById('colorDropdown');
        const swatch = document.querySelector('.color-swatch');
        if (dropdown && !dropdown.contains(e.target) && e.target !== swatch) {
            dropdown.classList.add('hidden');
        }
    });

    window.onload = renderDashboard;
