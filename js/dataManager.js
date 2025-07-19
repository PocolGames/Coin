/**
 * localStorage 기반 데이터 관리 클래스
 * 투자 계산기 데이터의 저장, 불러오기, 내보내기, 가져오기 기능 제공
 */
class DataManager {
    constructor() {
        this.storageKey = 'investment_calculator_data';
        this.settingsKey = 'investment_calculator_settings';
        this.version = '1.0.0';
    }

    /**
     * 데이터 저장
     * @param {string} key - 저장할 키
     * @param {any} data - 저장할 데이터
     * @returns {boolean} 저장 성공 여부
     */
    save(key, data) {
        try {
            const dataWithMetadata = {
                data: data,
                timestamp: new Date().toISOString(),
                version: this.version
            };
            localStorage.setItem(key, JSON.stringify(dataWithMetadata));
            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            return false;
        }
    }

    /**
     * 데이터 불러오기
     * @param {string} key - 불러올 키
     * @returns {any|null} 불러온 데이터 또는 null
     */
    load(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            
            // 메타데이터가 있는 새로운 형식인지 확인
            if (parsed.data !== undefined && parsed.timestamp !== undefined) {
                return parsed.data;
            }
            
            // 이전 형식의 데이터라면 그대로 반환
            return parsed;
        } catch (error) {
            console.error('데이터 불러오기 실패:', error);
            return null;
        }
    }

    /**
     * 특정 키의 데이터 삭제
     * @param {string} key - 삭제할 키
     * @returns {boolean} 삭제 성공 여부
     */
    delete(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('데이터 삭제 실패:', error);
            return false;
        }
    }

    /**
     * 모든 데이터 삭제
     * @returns {boolean} 삭제 성공 여부
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.settingsKey);
            return true;
        } catch (error) {
            console.error('전체 데이터 삭제 실패:', error);
            return false;
        }
    }

    /**
     * 저장된 모든 키 목록 반환
     * @returns {Array} 키 목록
     */
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('investment_calculator_')) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * 저장 공간 사용량 확인 (대략적)
     * @returns {Object} 사용량 정보
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('investment_calculator_')) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + (value ? value.length : 0);
                    itemCount++;
                }
            }
            
            return {
                totalSize: totalSize,
                itemCount: itemCount,
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('저장소 정보 조회 실패:', error);
            return { totalSize: 0, itemCount: 0, formattedSize: '0 B' };
        }
    }

    /**
     * 바이트를 읽기 쉬운 형태로 변환
     * @param {number} bytes - 바이트 수
     * @returns {string} 포맷된 크기
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 투자 설정 저장
     * @param {Object} settings - 투자 설정 객체
     * @returns {boolean} 저장 성공 여부
     */
    saveSettings(settings) {
        return this.save(this.settingsKey, settings);
    }

    /**
     * 투자 설정 불러오기
     * @returns {Object|null} 투자 설정 또는 null
     */
    loadSettings() {
        return this.load(this.settingsKey);
    }

    /**
     * 투자 데이터 저장
     * @param {Array} data - 투자 데이터 배열
     * @returns {boolean} 저장 성공 여부
     */
    saveInvestmentData(data) {
        return this.save(this.storageKey, data);
    }

    /**
     * 투자 데이터 불러오기
     * @returns {Array|null} 투자 데이터 또는 null
     */
    loadInvestmentData() {
        return this.load(this.storageKey) || [];
    }

    /**
     * JSON 파일로 데이터 내보내기
     * @param {Object} data - 내보낼 데이터
     * @param {string} filename - 파일명 (기본값: 현재 날짜)
     */
    exportToJSON(data, filename = null) {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                version: this.version,
                settings: this.loadSettings(),
                investmentData: this.loadInvestmentData(),
                customData: data || {}
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `investment_data_${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('JSON 내보내기 실패:', error);
            return false;
        }
    }

    /**
     * JSON 파일에서 데이터 가져오기
     * @param {File} file - 가져올 JSON 파일
     * @returns {Promise<boolean>} 가져오기 성공 여부
     */
    importFromJSON(file) {
        return new Promise((resolve) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        // 데이터 유효성 검증
                        if (!this.validateImportData(importData)) {
                            console.error('유효하지 않은 데이터 형식');
                            resolve(false);
                            return;
                        }
                        
                        // 설정 데이터 복원
                        if (importData.settings) {
                            this.saveSettings(importData.settings);
                        }
                        
                        // 투자 데이터 복원
                        if (importData.investmentData) {
                            this.saveInvestmentData(importData.investmentData);
                        }
                        
                        resolve(true);
                    } catch (parseError) {
                        console.error('JSON 파싱 실패:', parseError);
                        resolve(false);
                    }
                };
                
                reader.onerror = () => {
                    console.error('파일 읽기 실패');
                    resolve(false);
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('JSON 가져오기 실패:', error);
                resolve(false);
            }
        });
    }

    /**
     * 가져온 데이터의 유효성 검증
     * @param {Object} data - 검증할 데이터
     * @returns {boolean} 유효성 여부
     */
    validateImportData(data) {
        try {
            // 기본 구조 확인
            if (typeof data !== 'object' || data === null) {
                return false;
            }
            
            // 필수 필드 확인
            if (!data.exportDate || !data.version) {
                return false;
            }
            
            // 설정 데이터 검증
            if (data.settings && typeof data.settings !== 'object') {
                return false;
            }
            
            // 투자 데이터 검증
            if (data.investmentData && !Array.isArray(data.investmentData)) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('데이터 검증 실패:', error);
            return false;
        }
    }

    /**
     * 브라우저별 localStorage 저장 경로 안내
     * @returns {string} 저장 경로 정보
     */
    getStoragePath() {
        const userAgent = navigator.userAgent.toLowerCase();
        let browserInfo = '';
        
        if (userAgent.includes('chrome')) {
            browserInfo = 'Chrome: %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb\\';
        } else if (userAgent.includes('firefox')) {
            browserInfo = 'Firefox: %APPDATA%\\Mozilla\\Firefox\\Profiles\\[프로필명]\\storage\\default\\';
        } else if (userAgent.includes('edge')) {
            browserInfo = 'Edge: %LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb\\';
        } else {
            browserInfo = '브라우저별 localStorage 경로를 확인해주세요.';
        }
        
        return browserInfo;
    }

    /**
     * 저장 경로를 클립보드에 복사
     */
    copyStoragePathToClipboard() {
        const path = this.getStoragePath();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(path).then(() => {
                console.log('저장 경로가 클립보드에 복사되었습니다.');
            }).catch(err => {
                console.error('클립보드 복사 실패:', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = path;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                console.log('저장 경로가 클립보드에 복사되었습니다.');
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
            }
            document.body.removeChild(textArea);
        }
    }
}