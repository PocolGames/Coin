/**
 * 투자 수익률 계산기 클래스
 * 복리 계산, 수익률 계산, 목표 달성 일수 계산 등의 로직 제공
 */
class InvestmentCalculator {
    constructor() {
        this.settings = {
            startDate: null,
            startValue: 0,
            growthRate: 0,
            targetValue: 0
        };
        this.investmentData = [];
    }

    /**
     * 계산기 설정 업데이트
     * @param {Object} newSettings - 새로운 설정
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.validateSettings();
    }

    /**
     * 설정 값 유효성 검증
     * @returns {Object} 검증 결과
     */
    validateSettings() {
        const errors = [];
        
        if (!this.settings.startDate) {
            errors.push('시작날짜를 입력해주세요.');
        }
        
        if (this.settings.startValue <= 0) {
            errors.push('시작값은 0보다 커야 합니다.');
        }
        
        if (this.settings.growthRate <= 0) {
            errors.push('증가율은 0보다 커야 합니다.');
        }
        
        if (this.settings.targetValue <= this.settings.startValue) {
            errors.push('목표값은 시작값보다 커야 합니다.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 목표 달성까지 소요 일수 계산
     * @returns {number} 소요 일수
     */
    calculateDaysToTarget() {
        if (!this.validateSettings().isValid) {
            return 0;
        }
        
        const { startValue, growthRate, targetValue } = this.settings;
        
        // 복리 계산 공식: A = P(1 + r)^t
        // t = log(A/P) / log(1 + r)
        const dailyRate = growthRate / 100;
        const days = Math.log(targetValue / startValue) / Math.log(1 + dailyRate);
        
        return Math.ceil(days);
    }

    /**
     * 일별 예상 증가값 계산
     * @returns {number} 일별 예상 증가값
     */
    calculateDailyIncrease() {
        if (!this.validateSettings().isValid) {
            return 0;
        }
        
        const { startValue, growthRate } = this.settings;
        const dailyRate = growthRate / 100;
        
        return startValue * dailyRate;
    }

    /**
     * 특정 일차의 예상값 계산 (복리) - 0일차부터 계산 가능
     * @param {number} day - 일차 (0부터 시작 가능)
     * @returns {number} 예상값
     */
    calculateExpectedValue(day) {
        if (!this.validateSettings().isValid || day < 0) {
            return 0;
        }
        
        const { startValue, growthRate } = this.settings;
        const dailyRate = growthRate / 100;
        
        // 복리 계산: A = P(1 + r)^t
        return startValue * Math.pow(1 + dailyRate, day);
    }

    /**
     * 특정 일차의 날짜 계산 (1일차부터 시작)
     * @param {number} day - 일차 (1부터 시작)
     * @returns {string} 날짜 문자열 (YYYY-MM-DD)
     */
    calculateDate(day) {
        if (!this.settings.startDate || day < 1) {
            return '';
        }
        
        const startDate = new Date(this.settings.startDate);
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + day - 1); // 1일차 = 시작날짜
        
        return targetDate.toISOString().split('T')[0];
    }

    /**
     * 수익률 계산
     * @param {number} currentValue - 현재값
     * @param {number} previousValue - 이전값
     * @returns {number} 수익률 (백분율)
     */
    calculateReturnRate(currentValue, previousValue) {
        if (previousValue <= 0) {
            return 0;
        }
        
        return ((currentValue - previousValue) / previousValue) * 100;
    }

    /**
     * 누적 수익률 계산
     * @param {number} currentValue - 현재값
     * @param {number} startValue - 시작값
     * @returns {number} 누적 수익률 (백분율)
     */
    calculateTotalReturnRate(currentValue, startValue = null) {
        const initialValue = startValue || this.settings.startValue;
        
        if (initialValue <= 0) {
            return 0;
        }
        
        return ((currentValue - initialValue) / initialValue) * 100;
    }

    /**
     * 전체 투자 데이터 테이블 생성 (1일차부터 시작)
     * @returns {Array} 투자 데이터 배열
     */
    generateInvestmentTable() {
        const validation = this.validateSettings();
        if (!validation.isValid) {
            return [];
        }
        
        const daysToTarget = this.calculateDaysToTarget();
        const table = [];
        
        for (let day = 1; day <= daysToTarget; day++) {
            let startValue;
            
            if (day === 1) {
                // 1일차의 시작값은 설정된 시작값
                startValue = this.settings.startValue;
            } else {
                // 2일차부터는 이전 날의 실제값이 시작값
                const previousData = this.investmentData.find(item => item.day === day - 1);
                if (previousData && previousData.actualValue !== null) {
                    startValue = previousData.actualValue;
                } else {
                    // 이전 날의 실제값이 없으면 null로 설정 (대시 없음)
                    startValue = null;
                }
            }
            
            const expectedValue = this.calculateExpectedValue(day);
            const date = this.calculateDate(day);
            
            // 기존 실제값이 있다면 사용, 없다면 null
            const existingData = this.investmentData.find(item => item.day === day);
            const actualValue = existingData ? existingData.actualValue : null;
            
            // 수익률 계산 - 시작값이 있을 때만 계산
            let returnRate = null;
            if (actualValue !== null && startValue !== null) {
                returnRate = this.calculateReturnRate(actualValue, startValue);
            }
            
            table.push({
                day: day,
                date: date,
                startValue: startValue,
                expectedValue: expectedValue,
                actualValue: actualValue,
                returnRate: returnRate
            });
        }
        
        return table;
    }

    /**
     * 이전 일차의 실제값 찾기 (1일차부터 시작)
     * @param {number} currentDay - 현재 일차
     * @returns {number|null} 이전 실제값
     */
    getPreviousActualValue(currentDay) {
        if (currentDay <= 1) {
            return this.settings.startValue;
        }
        
        // 현재 일차 이전의 실제값이 입력된 가장 최근 데이터 찾기
        for (let day = currentDay - 1; day >= 1; day--) {
            const data = this.investmentData.find(item => item.day === day);
            if (data && data.actualValue !== null) {
                return data.actualValue;
            }
        }
        
        return this.settings.startValue;
    }

    /**
     * 실제값 업데이트 (1일차부터 시작)
     * @param {number} day - 일차
     * @param {number} actualValue - 실제값
     * @returns {boolean} 업데이트 성공 여부
     */
    updateActualValue(day, actualValue) {
        if (day < 1 || actualValue < 0) {
            return false;
        }
        
        // 기존 데이터 찾기
        const existingIndex = this.investmentData.findIndex(item => item.day === day);
        
        if (existingIndex !== -1) {
            // 기존 데이터 업데이트
            this.investmentData[existingIndex].actualValue = actualValue;
            this.investmentData[existingIndex].timestamp = new Date().toISOString();
        } else {
            // 새 데이터 추가
            this.investmentData.push({
                day: day,
                actualValue: actualValue,
                timestamp: new Date().toISOString()
            });
        }
        
        // 일차별로 정렬
        this.investmentData.sort((a, b) => a.day - b.day);
        
        return true;
    }

    /**
     * 투자 데이터 설정
     * @param {Array} data - 투자 데이터 배열
     */
    setInvestmentData(data) {
        this.investmentData = Array.isArray(data) ? data : [];
    }

    /**
     * 투자 데이터 반환
     * @returns {Array} 투자 데이터 배열
     */
    getInvestmentData() {
        return this.investmentData;
    }

    /**
     * 통계 정보 계산
     * @returns {Object} 통계 정보
     */
    calculateStatistics() {
        const table = this.generateInvestmentTable();
        const actualData = table.filter(item => item.actualValue !== null);
        
        if (actualData.length === 0) {
            return {
                totalDays: 0,
                daysWithData: 0,
                averageReturn: 0,
                totalReturn: 0,
                currentValue: 0,
                targetProgress: 0
            };
        }
        
        const latestData = actualData[actualData.length - 1];
        const validReturns = actualData
            .filter(item => item.returnRate !== null && !isNaN(item.returnRate))
            .map(item => item.returnRate);
        
        const averageReturn = validReturns.length > 0 
            ? validReturns.reduce((sum, rate) => sum + rate, 0) / validReturns.length 
            : 0;
        
        const totalReturn = this.calculateTotalReturnRate(latestData.actualValue);
        const targetProgress = (latestData.actualValue / this.settings.targetValue) * 100;
        
        return {
            totalDays: table.length,
            daysWithData: actualData.length,
            averageReturn: averageReturn,
            totalReturn: totalReturn,
            currentValue: latestData.actualValue,
            targetProgress: Math.min(targetProgress, 100)
        };
    }

    /**
     * 데이터 초기화
     */
    reset() {
        this.settings = {
            startDate: null,
            startValue: 0,
            growthRate: 0,
            targetValue: 0
        };
        this.investmentData = [];
    }

    /**
     * 값을 천 단위 구분자와 함께 포맷
     * @param {number} value - 포맷할 값
     * @param {number} decimals - 소수점 자리수
     * @returns {string} 포맷된 문자열
     */
    formatNumber(value, decimals = 2) {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        
        return value.toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * 수익률을 포맷된 문자열로 반환
     * @param {number} rate - 수익률
     * @returns {string} 포맷된 수익률 문자열
     */
    formatReturnRate(rate) {
        if (rate === null || rate === undefined || isNaN(rate)) {
            return '-';
        }
        
        const sign = rate >= 0 ? '+' : '';
        return `${sign}${rate.toFixed(2)}%`;
    }
}