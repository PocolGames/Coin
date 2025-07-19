/**
 * 투자 수익률 계산기 메인 애플리케이션
 * UI 상호작용, 이벤트 처리, 데이터 바인딩 등을 담당
 */
class InvestmentApp {
    constructor() {
        this.dataManager = new DataManager();
        this.calculator = new InvestmentCalculator();
        this.debounceTimer = null;
        
        this.elements = {
            startDate: document.getElementById('start-date'),
            startValue: document.getElementById('start-value'),
            growthRate: document.getElementById('growth-rate'),
            targetValue: document.getElementById('target-value'),
            daysToTarget: document.getElementById('days-to-target'),
            dailyIncrease: document.getElementById('daily-increase'),
            tableBody: document.getElementById('table-body'),
            noDataMessage: document.getElementById('no-data-message'),
            saveButton: document.getElementById('save-data'),
            loadButton: document.getElementById('load-data'),
            exportButton: document.getElementById('export-data'),
            importButton: document.getElementById('import-data'),
            clearButton: document.getElementById('clear-data'),
            fileInput: document.getElementById('file-input'),
            helpButton: document.getElementById('help-button'),
            helpModal: document.getElementById('help-modal'),
            closeModal: document.getElementById('close-modal'),
            targetRateInput: document.getElementById('target-rate'),
            helpTableBody: document.getElementById('help-table-body')
        };
        
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    init() {
        this.bindEvents();
        this.loadSavedData();
        this.setDefaultDate();
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 입력 필드 이벤트 (debounce 적용)
        this.elements.startDate.addEventListener('change', () => this.updateCalculation());
        this.elements.startValue.addEventListener('input', () => this.debouncedUpdate());
        this.elements.growthRate.addEventListener('input', () => this.debouncedUpdate());
        this.elements.targetValue.addEventListener('input', () => this.debouncedUpdate());
        
        // blur 이벤트로 완전한 입력 후 검증
        this.elements.startValue.addEventListener('blur', () => this.updateCalculation());
        this.elements.growthRate.addEventListener('blur', () => this.updateCalculation());
        this.elements.targetValue.addEventListener('blur', () => this.updateCalculation());

        // 데이터 관리 버튼 이벤트
        this.elements.saveButton.addEventListener('click', () => this.saveData());
        this.elements.loadButton.addEventListener('click', () => this.loadData());
        this.elements.exportButton.addEventListener('click', () => this.exportData());
        this.elements.importButton.addEventListener('click', () => this.importData());
        this.elements.clearButton.addEventListener('click', () => this.clearAllData());
        
        // 도움말 모달 이벤트
        this.elements.helpButton.addEventListener('click', () => this.showHelpModal());
        this.elements.closeModal.addEventListener('click', () => this.hideHelpModal());
        this.elements.helpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.helpModal) {
                this.hideHelpModal();
            }
        });
        
        // 목표 수익률 입력 이벤트
        this.elements.targetRateInput.addEventListener('input', () => this.updateHelpTable());
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.helpModal.style.display !== 'none') {
                this.hideHelpModal();
            }
        });
        
        // 파일 입력 이벤트
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    /**
     * 기본 시작날짜를 오늘로 설정
     */
    setDefaultDate() {
        if (!this.elements.startDate.value) {
            const today = new Date().toISOString().split('T')[0];
            this.elements.startDate.value = today;
        }
    }

    /**
     * 디바운싱된 업데이트 (입력 중에는 오류 메시지 표시 안함)
     */
    debouncedUpdate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updateCalculationSilent();
        }, 300);
    }

    /**
     * 조용한 계산 업데이트 (오류 메시지 표시 안함)
     */
    updateCalculationSilent() {
        const settings = this.getInputValues();
        this.calculator.updateSettings(settings);
        
        const validation = this.calculator.validateSettings();
        
        if (validation.isValid) {
            this.updateResults();
            this.generateTable();
            this.hideNoDataMessage();
        } else {
            // 입력 중에는 오류 메시지 표시하지 않고 테이블만 숨김
            this.showNoDataMessage();
        }
    }

    /**
     * 계산 결과 업데이트 (오류 메시지 포함)
     */
    updateCalculation() {
        const settings = this.getInputValues();
        this.calculator.updateSettings(settings);
        
        const validation = this.calculator.validateSettings();
        
        if (validation.isValid) {
            this.updateResults();
            this.generateTable();
            this.hideNoDataMessage();
        } else {
            this.showValidationErrors(validation.errors);
            this.showNoDataMessage();
        }
    }

    /**
     * 입력값 가져오기
     * @returns {Object} 입력값 객체
     */
    getInputValues() {
        return {
            startDate: this.elements.startDate.value,
            startValue: parseFloat(this.elements.startValue.value) || 0,
            growthRate: parseFloat(this.elements.growthRate.value) || 0,
            targetValue: parseFloat(this.elements.targetValue.value) || 0
        };
    }

    /**
     * 계산 결과 표시 업데이트
     */
    updateResults() {
        const daysToTarget = this.calculator.calculateDaysToTarget();
        const dailyIncrease = this.calculator.calculateDailyIncrease();
        
        this.elements.daysToTarget.querySelector('span').textContent = 
            this.calculator.formatNumber(daysToTarget, 0);
        this.elements.dailyIncrease.querySelector('span').textContent = 
            this.calculator.formatNumber(dailyIncrease, 2);
    }

    /**
     * 투자 테이블 생성
     */
    generateTable() {
        const tableData = this.calculator.generateInvestmentTable();
        this.elements.tableBody.innerHTML = '';
        
        tableData.forEach(row => {
            const tr = this.createTableRow(row);
            this.elements.tableBody.appendChild(tr);
        });
    }

    /**
     * 테이블 행 생성
     * @param {Object} rowData - 행 데이터
     * @returns {HTMLElement} 테이블 행 요소
     */
    createTableRow(rowData) {
        const tr = document.createElement('tr');
        
        // 일차
        const dayTd = document.createElement('td');
        dayTd.textContent = rowData.day;
        tr.appendChild(dayTd);
        
        // 날짜
        const dateTd = document.createElement('td');
        dateTd.textContent = this.formatDate(rowData.date);
        tr.appendChild(dateTd);
        
        // 시작값
        const startTd = document.createElement('td');
        if (rowData.startValue !== null) {
            startTd.textContent = this.calculator.formatNumber(rowData.startValue, 2);
            startTd.style.backgroundColor = '#f8f9fa';
            startTd.style.color = '#6c757d';
        } else {
            startTd.textContent = '-';
            startTd.style.backgroundColor = '#f8f9fa';
            startTd.style.color = '#6c757d';
        }
        tr.appendChild(startTd);
        
        // 예상값
        const expectedTd = document.createElement('td');
        expectedTd.textContent = this.calculator.formatNumber(rowData.expectedValue, 2);
        tr.appendChild(expectedTd);
        
        // 실제값 (입력 가능)
        const actualTd = document.createElement('td');
        const actualInput = document.createElement('input');
        actualInput.type = 'number';
        actualInput.className = 'actual-input';
        actualInput.placeholder = '입력';
        actualInput.step = '0.01';
        
        if (rowData.actualValue !== null) {
            actualInput.value = rowData.actualValue;
        }
        
        // 실제값 입력 이벤트
        actualInput.addEventListener('blur', () => {
            this.updateActualValue(rowData.day, actualInput.value);
        });
        
        actualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                actualInput.blur();
            }
        });
        
        actualTd.appendChild(actualInput);
        tr.appendChild(actualTd);
        
        // 수익률
        const returnTd = document.createElement('td');
        if (rowData.returnRate !== null) {
            returnTd.textContent = this.calculator.formatReturnRate(rowData.returnRate);
            returnTd.className = this.getReturnRateClass(rowData.returnRate);
        } else {
            returnTd.textContent = '-';
            returnTd.className = 'neutral';
        }
        tr.appendChild(returnTd);
        
        return tr;
    }

    /**
     * 수익률에 따른 CSS 클래스 반환
     * @param {number} rate - 수익률
     * @returns {string} CSS 클래스명
     */
    getReturnRateClass(rate) {
        if (rate > 0) return 'positive';
        if (rate < 0) return 'negative';
        return 'neutral';
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateString - 날짜 문자열
     * @returns {string} 포맷된 날짜
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    /**
     * 실제값 업데이트
     * @param {number} day - 일차
     * @param {string} value - 입력값
     */
    updateActualValue(day, value) {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue) || numValue < 0) {
            this.showMessage('올바른 양수를 입력해주세요.', 'error');
            return;
        }
        
        if (this.calculator.updateActualValue(day, numValue)) {
            // 실제값 업데이트 후 전체 테이블 재생성
            // 이렇게 하면 다음 날들의 시작값이 자동으로 업데이트됨
            this.generateTable();
            this.showMessage('실제값이 업데이트되었습니다.', 'success');
        } else {
            this.showMessage('실제값 업데이트에 실패했습니다.', 'error');
        }
    }

    /**
     * 데이터 저장
     */
    saveData() {
        const settings = this.getInputValues();
        const investmentData = this.calculator.getInvestmentData();
        
        const settingsSaved = this.dataManager.saveSettings(settings);
        const dataSaved = this.dataManager.saveInvestmentData(investmentData);
        
        if (settingsSaved && dataSaved) {
            this.showMessage('데이터가 저장되었습니다.', 'success');
        } else {
            this.showMessage('데이터 저장에 실패했습니다.', 'error');
        }
    }

    /**
     * 데이터 불러오기
     */
    loadData() {
        const settings = this.dataManager.loadSettings();
        const investmentData = this.dataManager.loadInvestmentData();
        
        if (settings) {
            this.setInputValues(settings);
            this.calculator.updateSettings(settings);
        }
        
        if (investmentData) {
            this.calculator.setInvestmentData(investmentData);
        }
        
        this.updateCalculation();
        this.showMessage('데이터가 불러와졌습니다.', 'success');
    }

    /**
     * 저장된 데이터 자동 로드
     */
    loadSavedData() {
        const settings = this.dataManager.loadSettings();
        const investmentData = this.dataManager.loadInvestmentData();
        
        if (settings) {
            this.setInputValues(settings);
            this.calculator.updateSettings(settings);
            
            if (investmentData) {
                this.calculator.setInvestmentData(investmentData);
            }
            
            this.updateCalculation();
        }
    }

    /**
     * 입력값 설정
     * @param {Object} settings - 설정 객체
     */
    setInputValues(settings) {
        this.elements.startDate.value = settings.startDate || '';
        this.elements.startValue.value = settings.startValue || '';
        this.elements.growthRate.value = settings.growthRate || '';
        this.elements.targetValue.value = settings.targetValue || '';
    }

    /**
     * 데이터 내보내기
     */
    exportData() {
        const success = this.dataManager.exportToJSON();
        if (success) {
            this.showMessage('데이터가 JSON 파일로 내보내졌습니다.', 'success');
        } else {
            this.showMessage('데이터 내보내기에 실패했습니다.', 'error');
        }
    }

    /**
     * 데이터 가져오기
     */
    importData() {
        this.elements.fileInput.click();
    }

    /**
     * 파일 가져오기 처리
     * @param {Event} event - 파일 선택 이벤트
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json') {
            this.showMessage('JSON 파일만 가져올 수 있습니다.', 'error');
            return;
        }
        
        const success = await this.dataManager.importFromJSON(file);
        if (success) {
            this.loadData();
            this.showMessage('데이터가 성공적으로 가져와졌습니다.', 'success');
        } else {
            this.showMessage('데이터 가져오기에 실패했습니다.', 'error');
        }
        
        // 파일 입력 초기화
        event.target.value = '';
    }

    /**
     * 모든 데이터 삭제
     */
    clearAllData() {
        if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        const success = this.dataManager.clear();
        if (success) {
            this.calculator.reset();
            this.setInputValues({});
            this.elements.tableBody.innerHTML = '';
            this.showNoDataMessage();
            this.showMessage('모든 데이터가 삭제되었습니다.', 'success');
        } else {
            this.showMessage('데이터 삭제에 실패했습니다.', 'error');
        }
    }

    /**
     * 유효성 검증 오류 표시
     * @param {Array} errors - 오류 배열
     */
    showValidationErrors(errors) {
        if (errors.length > 0) {
            // 콘솔에만 로그하고 팝업은 표시하지 않음
            console.warn('입력값 검증 오류:', errors.join(', '));
        }
    }

    /**
     * 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 메시지 타입 (success, error, info)
     */
    showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 유효성 검증 오류가 아닌 경우에만 alert 표시
        if (type === 'error' && !message.includes('0보다 커야') && !message.includes('보다 커야')) {
            alert(message.replace(/<br>/g, '\n'));
        }
        
        // 성공 메시지는 간단히 콘솔에만 표시
        if (type === 'success') {
            console.log('✅ ' + message);
        }
    }

    /**
     * 데이터 없음 메시지 표시
     */
    showNoDataMessage() {
        this.elements.noDataMessage.style.display = 'block';
        this.elements.tableBody.parentElement.style.display = 'none';
    }

    /**
     * 데이터 없음 메시지 숨김
     */
    hideNoDataMessage() {
        this.elements.noDataMessage.style.display = 'none';
        this.elements.tableBody.parentElement.style.display = 'block';
    }

    /**
     * 도움말 모달 표시
     */
    showHelpModal() {
        this.elements.helpModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
        this.updateHelpTable(); // 모달 열 때 테이블 업데이트
    }

    /**
     * 도움말 모달 숨김
     */
    hideHelpModal() {
        this.elements.helpModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 배경 스크롤 복원
    }

    /**
     * 도움말 테이블 업데이트
     */
    updateHelpTable() {
        const targetRate = parseFloat(this.elements.targetRateInput.value) || 3.5;
        const seedRatios = [10, 15, 20, 25]; // 시드 비율 (%)
        const leverages = [
            { name: '20배', fee: 1.0 },
            { name: '50배', fee: 2.5 },
            { name: '70배', fee: 3.5 }
        ];
        
        this.elements.helpTableBody.innerHTML = '';
        
        seedRatios.forEach(seedRatio => {
            const row = document.createElement('tr');
            
            // 시드 비율
            const seedCell = document.createElement('td');
            seedCell.textContent = `${seedRatio}%`;
            row.appendChild(seedCell);
            
            // 목표 수익률 (시드 비율 기준 필요 수익률)
            const requiredProfit = (targetRate / seedRatio) * 100;
            const targetCell = document.createElement('td');
            targetCell.textContent = `${targetRate}% = ${requiredProfit.toFixed(2)}% 수익 필요`;
            row.appendChild(targetCell);
            
            // 레버리지별 필요 수익률
            leverages.forEach(leverage => {
                const leverageCell = document.createElement('td');
                const leverageProfit = requiredProfit + leverage.fee;
                leverageCell.textContent = `${leverageProfit.toFixed(2)}%`;
                leverageCell.className = 'profit-cell';
                row.appendChild(leverageCell);
            });
            
            this.elements.helpTableBody.appendChild(row);
        });
    }
}

// 페이지 로드 후 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.investmentApp = new InvestmentApp();
});