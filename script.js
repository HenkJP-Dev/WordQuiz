// Word Lists Management
class WordListManager {
    constructor() {
        this.lists = this.loadLists();
        this.currentTheme = this.loadTheme();
        this.languagesSwapped = this.loadLanguageSwap();
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.setLanguageSwap(this.languagesSwapped);
        this.renderLists();
        this.setupEventListeners();
    }

    loadLists() {
        const saved = localStorage.getItem('wordLists');
        return saved ? JSON.parse(saved) : [];
    }

    saveLists() {
        localStorage.setItem('wordLists', JSON.stringify(this.lists));
    }

    loadTheme() {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.saveTheme(theme);
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggle();
        this.updateThemeLabel();
    }

    loadLanguageSwap() {
        const saved = localStorage.getItem('languagesSwapped');
        return saved === 'true';
    }

    saveLanguageSwap(swapped) {
        localStorage.setItem('languagesSwapped', swapped.toString());
    }

    setLanguageSwap(swapped) {
        this.languagesSwapped = swapped;
        this.saveLanguageSwap(swapped);
        this.updateSwapToggle();
        this.updateSwapLabel();
        this.renderLists(); // Re-render to show updated language order
    }

    addList(name, sourceLanguage, targetLanguage) {
        const newList = {
            id: Date.now().toString(),
            name: name,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            words: [],
            createdAt: new Date().toISOString()
        };

        this.lists.push(newList);
        this.saveLists();
        this.renderLists();

        // Automatically open edit modal for the new list
        this.currentEditingList = newList;
        this.showEditListModal();
        this.renderWordsList();
        this.updateEditListInfo();

        return newList;
    }

    deleteList(listId) {
        const list = this.getList(listId);
        if (!list) return;

        const confirmMessage = `Weet je zeker dat je "${list.name}" wilt verwijderen?\n\nDit zal de lijst en alle ${list.words.length} woord(en) erin permanent verwijderen.`;

        this.showConfirmModal('Lijst Verwijderen', confirmMessage, () => {
            this.lists = this.lists.filter(list => list.id !== listId);
            this.saveLists();
            this.renderLists();
        });
    }

    getList(listId) {
        return this.lists.find(list => list.id === listId);
    }

    getDisplayLanguages(list) {
        if (this.languagesSwapped) {
            return {
                source: list.targetLanguage,
                target: list.sourceLanguage
            };
        } else {
            return {
                source: list.sourceLanguage,
                target: list.targetLanguage
            };
        }
    }

    renderLists() {
        const container = document.getElementById('listsContainer');

        if (this.lists.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Nog geen woordenlijsten</h3>
                    <p>Maak je eerste woordenlijst om te beginnen met leren!</p>
                    <button class="btn btn-primary" onclick="wordListManager.showAddListModal()">
                        Maak Je Eerste Lijst
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.lists.map(list => {
            const displaySource = this.languagesSwapped ? list.targetLanguage : list.sourceLanguage;
            const displayTarget = this.languagesSwapped ? list.sourceLanguage : list.targetLanguage;

            return `
                <div class="list-card">
                    <div class="card-actions">
                        <button class="export-btn" onclick="wordListManager.exportSingleList('${list.id}')" title="Export list">
                            📤
                        </button>
                        <button class="delete-btn" onclick="wordListManager.deleteList('${list.id}')" title="Delete list">
                            ×
                        </button>
                    </div>
                    <h3>${list.name}</h3>
                    <div class="list-info">
                        <p><strong>Van:</strong> ${displaySource}</p>
                        <p><strong>Naar:</strong> ${displayTarget}</p>
                        <p class="word-count">${list.words.length} woord(en)</p>
                        <p><small>Aangemaakt: ${new Date(list.createdAt).toLocaleDateString()}</small></p>
                    </div>
                    <div class="list-actions">
                        <button class="btn btn-warning" onclick="wordListManager.editList('${list.id}')">
                            Lijst Bewerken
                        </button>
                        <button class="btn btn-success" onclick="wordListManager.startTest('${list.id}')">
                            Toets Starten
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showAddListModal() {
        const modal = document.getElementById('addListModal');
        modal.style.display = 'block';
        document.getElementById('listName').focus();
    }

    hideAddListModal() {
        const modal = document.getElementById('addListModal');
        modal.style.display = 'none';
        document.getElementById('addListForm').reset();
    }

    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'block';
    }

    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    }

    showEditListModal() {
        const modal = document.getElementById('editListModal');
        modal.style.display = 'block';
    }

    hideEditListModal() {
        const modal = document.getElementById('editListModal');
        modal.style.display = 'none';
        this.currentEditingList = null;
        document.getElementById('addWordForm').reset();
    }

    showTestModal() {
        const modal = document.getElementById('testModal');
        modal.style.display = 'block';
    }

    hideTestModal() {
        const modal = document.getElementById('testModal');
        modal.style.display = 'none';
        this.currentTestList = null;
        this.resetTest();
    }

    // Custom popup functionality
    showPopup(title, message) {
        document.getElementById('popupTitle').textContent = title;
        document.getElementById('popupMessage').textContent = message;
        document.getElementById('popupModal').style.display = 'block';
    }

    hidePopup() {
        document.getElementById('popupModal').style.display = 'none';
    }

    // Confirmation modal functionality
    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';

        // Store the confirmation callback
        this.pendingConfirmation = onConfirm;
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.pendingConfirmation = null;
    }

    showJsonStructureModal() {
        const modal = document.getElementById('jsonStructureModal');
        const exampleElement = document.getElementById('jsonStructureExample');

        // Create example JSON structure
        const exampleJson = {
            "exportDate": "2024-01-15T10:30:00.000Z",
            "totalLists": 1,
            "totalWords": 3,
            "lists": [
                {
                    "id": "1705312200000abc123",
                    "name": "listname",
                    "sourceLanguage": "Language to learn",
                    "targetLanguage": "User Language",
                    "words": [
                        {
                            "source": "word1",
                            "target": "translation1",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        },
                        {
                            "source": "word2",
                            "target": "translation2",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        },
                        {
                            "source": "word3",
                            "target": "translation3",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        }
                    ],
                    "createdAt": "2024-01-15T10:30:00.000Z"
                }
            ]
        };

        // Display formatted JSON
        exampleElement.textContent = JSON.stringify(exampleJson, null, 2);
        modal.style.display = 'block';
    }

    hideJsonStructureModal() {
        document.getElementById('jsonStructureModal').style.display = 'none';
    }

    copyJsonStructure() {
        const exampleElement = document.getElementById('jsonStructureExample');
        const text = exampleElement.textContent;

        navigator.clipboard.writeText(text).then(() => {
            this.showPopup('Gekopieerd', 'JSON structuur is gekopieerd naar je klembord!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showPopup('Fout', 'Kon niet naar klembord kopiëren. Probeer het handmatig.');
        });
    }

    downloadJsonTemplate() {
        const exampleJson = {
            "exportDate": "2024-01-15T10:30:00.000Z",
            "totalLists": 1,
            "totalWords": 3,
            "lists": [
                {
                    "id": "1705312200000abc123",
                    "name": "listname",
                    "sourceLanguage": "Language to learn",
                    "targetLanguage": "User Language",
                    "words": [
                        {
                            "source": "word1",
                            "target": "translation1",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        },
                        {
                            "source": "word2",
                            "target": "translation2",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        },
                        {
                            "source": "word3",
                            "target": "translation3",
                            "addedAt": "2024-01-15T10:30:00.000Z"
                        }
                    ],
                    "createdAt": "2024-01-15T10:30:00.000Z"
                }
            ]
        };

        const jsonString = JSON.stringify(exampleJson, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'woordenlijst-template.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showPopup('Template Gedownload', 'JSON template is gedownload!');
    }

    executeConfirmation() {
        if (this.pendingConfirmation) {
            this.pendingConfirmation();
        }
        this.hideConfirmModal();
    }



    exportAllLists() {
        if (this.lists.length === 0) {
            this.showPopup('Geen Gegevens om te Exporteren', 'Je hebt geen woordenlijsten om te exporteren. Maak eerst wat lijsten!');
            return;
        }

        // Create export data object
        const exportData = {
            exportDate: new Date().toISOString(),
            totalLists: this.lists.length,
            totalWords: this.lists.reduce((total, list) => total + list.words.length, 0),
            lists: this.lists
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `word-lists-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showPopup('Export Succesvol', `Succesvol ${this.lists.length} lijsten geëxporteerd met ${exportData.totalWords} woord(en) in totaal.`);
    }

    exportSingleList(listId) {
        const list = this.getList(listId);
        if (!list) {
            this.showPopup('Export Mislukt', 'Lijst niet gevonden.');
            return;
        }

        // Create export data for single list
        const exportData = {
            exportDate: new Date().toISOString(),
            totalLists: 1,
            totalWords: list.words.length,
            lists: [list]
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${list.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showPopup('Export Succesvol', `"${list.name}" is succesvol geëxporteerd!`);
    }

    importLists() {
        // Trigger file input
        document.getElementById('importFileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                // Validate import data structure
                if (!importData.lists || !Array.isArray(importData.lists)) {
                    this.showPopup('Ongeldig Bestand', 'Het geselecteerde bestand bevat geen geldige woordenlijst gegevens.');
                    return;
                }

                // Check for duplicate list names
                const duplicateNames = importData.lists.filter(importList =>
                    this.lists.some(existingList =>
                        existingList.name.toLowerCase() === importList.name.toLowerCase()
                    )
                );

                if (duplicateNames.length > 0) {
                    const duplicateList = duplicateNames[0];
                    this.showPopup('Dubbele Lijst Gevonden',
                        `Een lijst genaamd "${duplicateList.name}" bestaat al. Hernoem de lijst in het importbestand of verwijder eerst de bestaande lijst.`);
                    return;
                }

                // Import lists
                let importedCount = 0;
                let totalWords = 0;

                importData.lists.forEach(list => {
                    // Generate new IDs for imported lists to avoid conflicts
                    const newList = {
                        ...list,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        createdAt: list.createdAt || new Date().toISOString()
                    };

                    // Ensure words have proper structure
                    if (newList.words && Array.isArray(newList.words)) {
                        newList.words = newList.words.map(word => ({
                            ...word,
                            addedAt: word.addedAt || new Date().toISOString()
                        }));
                        totalWords += newList.words.length;
                    } else {
                        newList.words = [];
                    }

                    this.lists.push(newList);
                    importedCount++;
                });

                this.saveLists();
                this.renderLists();

                // Show success message
                this.showPopup('Import Succesvol',
                    `Succesvol ${importedCount} lijsten geïmporteerd met ${totalWords} woord(en) in totaal.`);

            } catch (error) {
                console.error('Import error:', error);
                this.showPopup('Import Mislukt', 'Het geselecteerde bestand kon niet worden gelezen. Zorg ervoor dat het een geldig JSON-bestand is dat is geëxporteerd uit deze applicatie.');
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }

    updateThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.checked = this.currentTheme === 'dark';
        }
    }

    updateThemeLabel() {
        const label = document.querySelector('.theme-label');
        if (label) {
            label.textContent = this.currentTheme === 'dark' ? 'Donker' : 'Licht';
        }
    }

    updateSwapToggle() {
        const toggle = document.getElementById('swapLanguagesToggle');
        if (toggle) {
            toggle.checked = this.languagesSwapped;
        }
    }

    updateSwapLabel() {
        const label = document.querySelector('.swap-label');
        if (label) {
            label.textContent = this.languagesSwapped ? 'Omgewisseld' : 'Normaal';
        }
    }

    updateEditListInfo() {
        if (!this.currentEditingList) return;

        const title = document.getElementById('editListTitle');
        const info = document.getElementById('editListInfo');
        const sourceLabel = document.getElementById('sourceWordLabel');
        const targetLabel = document.getElementById('targetWordLabel');

        const languages = this.getDisplayLanguages(this.currentEditingList);

        // Check if this is a newly created list (no words yet)
        const isNewList = this.currentEditingList.words.length === 0;

        title.textContent = `Bewerken: ${this.currentEditingList.name}`;
        info.textContent = `${languages.source} → ${languages.target}`;

        // Add visual indicator for new lists
        if (isNewList) {
            info.innerHTML += ' <span class="new-list-badge">Nieuwe Lijst</span>';
        }

        // Update labels based on swap setting
        sourceLabel.textContent = `${languages.source} Woord:`;
        targetLabel.textContent = `${languages.target} Vertaling:`;
    }

    renderWordsList() {
        if (!this.currentEditingList) return;

        const container = document.getElementById('wordsList');
        const countElement = document.getElementById('wordCount');

        countElement.textContent = this.currentEditingList.words.length;

        if (this.currentEditingList.words.length === 0) {
            container.innerHTML = `
                <div class="empty-words">
                    <p>Nog geen woorden toegevoegd. Voeg je eerste woord hierboven toe!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentEditingList.words.map((word, index) => {
            const languages = this.getDisplayLanguages(this.currentEditingList);
            const displaySource = this.languagesSwapped ? word.target : word.source;
            const displayTarget = this.languagesSwapped ? word.source : word.target;

            return `
                <div class="word-item">
                    <div class="word-content">
                        <div class="word-source">${displaySource}</div>
                        <div class="word-target">${displayTarget}</div>
                    </div>
                    <div class="word-actions">
                        <button class="btn btn-small btn-danger" onclick="wordListManager.deleteWord(${index})">
                            Verwijderen
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    addWord(sourceWord, targetWord) {
        if (!this.currentEditingList) return;

        // Determine the actual source and target based on swap setting
        let actualSource, actualTarget;

        if (this.languagesSwapped) {
            // If swapped, the "source" input is actually the target language
            actualSource = targetWord.trim();
            actualTarget = sourceWord.trim();
        } else {
            // If not swapped, use the inputs as-is
            actualSource = sourceWord.trim();
            actualTarget = targetWord.trim();
        }

        const newWord = {
            source: actualSource,
            target: actualTarget,
            addedAt: new Date().toISOString()
        };

        this.currentEditingList.words.push(newWord);
        this.saveLists();
        this.renderWordsList();
        this.renderLists(); // Update the main list display
    }

    deleteWord(wordIndex) {
        if (!this.currentEditingList) return;

        this.showConfirmModal('Woord Verwijderen', 'Weet je zeker dat je dit woord wilt verwijderen?', () => {
            this.currentEditingList.words.splice(wordIndex, 1);
            this.saveLists();
            this.renderWordsList();
            this.renderLists(); // Update the main list display
        });
    }

    // Test functionality
    showTestSetup() {
        if (!this.currentTestList) return;

        const title = document.getElementById('testSetupTitle');
        const info = document.getElementById('testSetupInfo');
        const totalWords = document.getElementById('testTotalWords');
        const wordCountSelect = document.getElementById('testWordCount');

        const languages = this.getDisplayLanguages(this.currentTestList);

        title.textContent = `Toets: ${this.currentTestList.name}`;
        info.textContent = `Vertaal van ${languages.source} naar ${languages.target}`;
        totalWords.textContent = this.currentTestList.words.length;

        // Update select options based on available words
        const wordCount = this.currentTestList.words.length;
        wordCountSelect.innerHTML = '';

        [5, 10, 15, 20].forEach(count => {
            if (count <= wordCount) {
                const option = document.createElement('option');
                option.value = count;
                option.textContent = `${count} woorden`;
                wordCountSelect.appendChild(option);
            }
        });

        if (wordCount > 0) {
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Alle woorden';
            wordCountSelect.appendChild(allOption);
        }

        // Show setup screen
        document.getElementById('testSetup').style.display = 'block';
        document.getElementById('testQuestion').style.display = 'none';
        document.getElementById('testResults').style.display = 'none';
    }

    startTestSession() {
        if (!this.currentTestList) return;

        const wordCount = document.getElementById('testWordCount').value;
        const totalWords = this.currentTestList.words.length;

        this.testWords = [...this.currentTestList.words];

        // Shuffle words
        for (let i = this.testWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.testWords[i], this.testWords[j]] = [this.testWords[j], this.testWords[i]];
        }

        // Limit words if needed
        if (wordCount !== 'all') {
            this.testWords = this.testWords.slice(0, parseInt(wordCount));
        }

        this.currentQuestionIndex = 0;
        this.testResults = [];
        this.incorrectWords = []; // Track words that need to be repeated
        this.originalWordCount = this.testWords.length; // Store original count

        this.showQuestion();
    }

    showQuestion() {
        // Check if we've completed all original words and need to start review phase
        if (this.currentQuestionIndex >= this.originalWordCount && this.incorrectWords.length > 0) {
            // Shuffle incorrect words and add them to the end
            for (let i = this.incorrectWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.incorrectWords[i], this.incorrectWords[j]] = [this.incorrectWords[j], this.incorrectWords[i]];
            }

            // Add incorrect words to the test queue
            this.testWords = [...this.testWords, ...this.incorrectWords];
            this.incorrectWords = []; // Clear the incorrect words list
        }

        // Check if we've completed all words (original + review)
        if (this.currentQuestionIndex >= this.testWords.length) {
            // No more words to test, show results
            this.showResults();
            return;
        }

        const currentWord = this.testWords[this.currentQuestionIndex];
        const languages = this.getDisplayLanguages(this.currentTestList);

        // Determine which word to show based on language swap setting
        const questionWord = this.languagesSwapped ? currentWord.target : currentWord.source;
        const correctAnswer = this.languagesSwapped ? currentWord.source : currentWord.target;

        document.getElementById('questionText').textContent = `Vertaal dit woord:`;
        document.getElementById('wordToTranslate').textContent = questionWord;
        document.getElementById('answerLabel').textContent = `Jouw antwoord (${languages.target}):`;

        // Update progress bar - should never exceed 100% for original words
        if (this.currentQuestionIndex < this.originalWordCount) {
            // Still in original words phase
            const progress = ((this.currentQuestionIndex + 1) / this.originalWordCount) * 100;
            document.getElementById('testProgress').style.width = `${progress}%`;
            document.getElementById('progressText').textContent = `${this.currentQuestionIndex + 1} / ${this.originalWordCount}`;
        } else {
            // In review phase - progress bar stays at 100%
            document.getElementById('testProgress').style.width = '100%';
            const reviewCount = this.currentQuestionIndex - this.originalWordCount + 1;
            const totalReviewWords = this.testWords.length - this.originalWordCount;
            document.getElementById('progressText').textContent = `Herhaling: ${reviewCount} / ${totalReviewWords}`;
        }

        // Clear previous answer and show form
        document.getElementById('userAnswer').value = '';
        document.getElementById('answerForm').style.display = 'block';
        document.getElementById('answerFeedback').style.display = 'none';
        document.getElementById('userAnswer').focus();

        // Store correct answer for validation
        this.currentCorrectAnswer = correctAnswer;

        // Show question screen
        document.getElementById('testSetup').style.display = 'none';
        document.getElementById('testQuestion').style.display = 'block';
        document.getElementById('testResults').style.display = 'none';
    }

    submitAnswer(userAnswer) {
        const isCorrect = this.checkAnswer(userAnswer, this.currentCorrectAnswer);
        const currentWord = this.testWords[this.currentQuestionIndex];

        // Store result
        this.testResults.push({
            question: currentWord,
            userAnswer: userAnswer,
            correctAnswer: this.currentCorrectAnswer,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            // If correct, move to next question immediately
            this.currentQuestionIndex++;
            this.showQuestion();
        } else {
            // If incorrect, add word to incorrect words list for repetition
            if (!this.incorrectWords.some(word => word.source === currentWord.source && word.target === currentWord.target)) {
                this.incorrectWords.push(currentWord);
            }
            // Show feedback
            this.showAnswerFeedback(userAnswer, this.currentCorrectAnswer);
        }
    }

    checkAnswer(userAnswer, correctAnswer) {
        // Simple case-insensitive comparison
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }

    showAnswerFeedback(userAnswer, correctAnswer) {
        // Hide the question form
        document.getElementById('answerForm').style.display = 'none';

        // Show feedback
        document.getElementById('userAnswerDisplay').textContent = userAnswer;
        document.getElementById('correctAnswerDisplay').textContent = correctAnswer;
        document.getElementById('answerFeedback').style.display = 'block';
    }

    hideAnswerFeedback() {
        // Hide feedback
        document.getElementById('answerFeedback').style.display = 'none';

        // Show the question form again
        document.getElementById('answerForm').style.display = 'block';
    }

    showResults() {
        // Calculate results based on unique words (not repeated attempts)
        const uniqueResults = this.testResults.filter((result, index, self) =>
            index === self.findIndex(r =>
                r.question.source === result.question.source &&
                r.question.target === result.question.target
            )
        );

        const correctCount = uniqueResults.filter(result => result.isCorrect).length;
        const totalCount = uniqueResults.length;
        const accuracy = Math.round((correctCount / totalCount) * 100);

        // Calculate total attempts (including repetitions)
        const totalAttempts = this.testResults.length;
        const repeatedCount = totalAttempts - totalCount;

        document.getElementById('correctAnswers').textContent = correctCount;
        document.getElementById('totalQuestions').textContent = totalCount;
        document.getElementById('accuracyPercentage').textContent = `${accuracy}%`;

        this.renderResultsList();

        // Show results screen
        document.getElementById('testSetup').style.display = 'none';
        document.getElementById('testQuestion').style.display = 'none';
        document.getElementById('testResults').style.display = 'block';
    }

    renderResultsList() {
        const container = document.getElementById('resultsList');

        // Group results by word to show repetition attempts
        const groupedResults = {};
        this.testResults.forEach((result, index) => {
            const key = `${result.question.source}-${result.question.target}`;
            if (!groupedResults[key]) {
                groupedResults[key] = [];
            }
            groupedResults[key].push({ ...result, attemptNumber: groupedResults[key].length + 1 });
        });

        container.innerHTML = Object.values(groupedResults).map(group => {
            const result = group[0]; // Use first result for word info
            const languages = this.getDisplayLanguages(this.currentTestList);
            const questionWord = this.languagesSwapped ? result.question.target : result.question.source;
            const correctAnswer = this.languagesSwapped ? result.question.source : result.question.target;

            const attempts = group.length;
            const isCorrect = group.some(r => r.isCorrect);
            const lastAttempt = group[group.length - 1];

            let attemptInfo = '';
            if (attempts > 1) {
                attemptInfo = ` (${attempts} pogingen)`;
            }

            return `
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="result-word">
                        <div class="result-question">${questionWord}${attemptInfo}</div>
                        <div class="result-answer">
                            Eindantwoord: ${lastAttempt.userAnswer} | Correct: ${correctAnswer}
                        </div>
                    </div>
                    <span class="result-status ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? '✓' : '✗'}
                    </span>
                </div>
            `;
        }).join('');
    }

    resetTest() {
        this.currentTestList = null;
        this.testWords = [];
        this.currentQuestionIndex = 0;
        this.testResults = [];
        this.currentCorrectAnswer = '';
    }

    editList(listId) {
        const list = this.getList(listId);
        if (!list) return;

        this.currentEditingList = list;
        this.showEditListModal();
        this.renderWordsList();
        this.updateEditListInfo();
    }

    startTest(listId) {
        const list = this.getList(listId);
        if (list.words.length === 0) {
            this.showPopup('Geen Woorden Beschikbaar', `"${list.name}" heeft nog geen woorden. Voeg eerst wat woorden toe!`);
            return;
        }

        this.currentTestList = list;
        this.showTestModal();
        this.showTestSetup();
    }

    setupEventListeners() {
        // Add List Button
        document.getElementById('addListBtn').addEventListener('click', () => {
            this.showAddListModal();
        });

        // Settings Button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            this.setTheme(newTheme);
        });

        // Language Swap Toggle
        document.getElementById('swapLanguagesToggle').addEventListener('change', (e) => {
            this.setLanguageSwap(e.target.checked);
        });

        // Modal Close Buttons
        document.querySelector('.close').addEventListener('click', () => {
            this.hideAddListModal();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('closeEditList').addEventListener('click', () => {
            this.hideEditListModal();
        });

        document.getElementById('closeTest').addEventListener('click', () => {
            this.hideTestModal();
        });

        // Cancel Button
        document.getElementById('cancelAddList').addEventListener('click', () => {
            this.hideAddListModal();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            const addListModal = document.getElementById('addListModal');
            const settingsModal = document.getElementById('settingsModal');
            const editListModal = document.getElementById('editListModal');
            const testModal = document.getElementById('testModal');
            const popupModal = document.getElementById('popupModal');
            const confirmModal = document.getElementById('confirmModal');
            const jsonStructureModal = document.getElementById('jsonStructureModal');

            if (event.target === addListModal) {
                this.hideAddListModal();
            }

            if (event.target === settingsModal) {
                this.hideSettingsModal();
            }

            if (event.target === editListModal) {
                this.hideEditListModal();
            }

            if (event.target === testModal) {
                this.hideTestModal();
            }

            if (event.target === popupModal) {
                this.hidePopup();
            }

            if (event.target === confirmModal) {
                this.hideConfirmModal();
            }

            if (event.target === jsonStructureModal) {
                this.hideJsonStructureModal();
            }
        });

        // Add List Form
        document.getElementById('addListForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const name = formData.get('listName').trim();
            const sourceLanguage = formData.get('sourceLanguage').trim();
            const targetLanguage = formData.get('targetLanguage').trim();

            if (!name || !sourceLanguage || !targetLanguage) {
                this.showPopup('Missing Information', 'Please fill in all fields');
                return;
            }

            // Check if list name already exists
            if (this.lists.some(list => list.name.toLowerCase() === name.toLowerCase())) {
                this.showPopup('List Already Exists', 'A list with this name already exists. Please choose a different name.');
                return;
            }

            this.addList(name, sourceLanguage, targetLanguage);
            this.hideAddListModal();
        });

        // Add Word Form
        document.getElementById('addWordForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const sourceWord = formData.get('sourceWord').trim();
            const targetWord = formData.get('targetWord').trim();

            if (!sourceWord || !targetWord) {
                this.showPopup('Missing Information', 'Please fill in both word fields');
                return;
            }

            this.addWord(sourceWord, targetWord);
            e.target.reset();
        });

        // Test Event Listeners
        document.getElementById('startTest').addEventListener('click', () => {
            this.startTestSession();
        });

        document.getElementById('cancelTest').addEventListener('click', () => {
            this.hideTestModal();
        });

        document.getElementById('answerForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const userAnswer = document.getElementById('userAnswer').value.trim();
            if (!userAnswer) {
                this.showPopup('Missing Answer', 'Please enter your answer');
                return;
            }

            this.submitAnswer(userAnswer);
        });

        document.getElementById('continueTest').addEventListener('click', () => {
            this.currentQuestionIndex++;
            this.showQuestion();
        });

        document.getElementById('retakeTest').addEventListener('click', () => {
            this.showTestSetup();
        });

        document.getElementById('finishTest').addEventListener('click', () => {
            this.hideTestModal();
        });

        // Popup OK button
        document.getElementById('popupOk').addEventListener('click', () => {
            this.hidePopup();
        });

        // Enter key for test feedback navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const answerFeedback = document.getElementById('answerFeedback');
                if (answerFeedback.style.display === 'block' && this.currentTestList) {
                    e.preventDefault();
                    this.currentQuestionIndex++;
                    this.showQuestion();
                }
            }
        });

        // Export Data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportAllLists();
        });

        // Import Data button
        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importLists();
        });

        // File input change event
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Confirmation modal buttons
        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.hideConfirmModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.executeConfirmation();
        });

        // JSON Structure modal buttons
        document.getElementById('showJsonStructureBtn').addEventListener('click', () => {
            this.showJsonStructureModal();
        });

        document.getElementById('closeJsonStructure').addEventListener('click', () => {
            this.hideJsonStructureModal();
        });

        document.getElementById('copyJsonStructureBtn').addEventListener('click', () => {
            this.copyJsonStructure();
        });

        document.getElementById('downloadJsonTemplateBtn').addEventListener('click', () => {
            this.downloadJsonTemplate();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAddListModal();
                this.hideSettingsModal();
                this.hideEditListModal();
                this.hideTestModal();
                this.hidePopup();
                this.hideConfirmModal();
                this.hideJsonStructureModal();
            }
        });
    }
}

// Initialize the application
let wordListManager;

document.addEventListener('DOMContentLoaded', () => {
    wordListManager = new WordListManager();
}); 