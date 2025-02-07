let chart = null;
let challengeActive = false;

// 初始化检查本地存储
function init() {
    console.log('Initializing...');
    
    const challengeData = localStorage.getItem('challenge');
    if (challengeData) {
        console.log('Found challenge data:', challengeData);
        
        const challenge = JSON.parse(challengeData);
        const now = Date.now();
        
        if (challenge.endDate > now) {
            challengeActive = true;
            
            // 设置开始日期输入框的值和状态
            const startDateInput = document.getElementById('startDate');
            startDateInput.value = new Date(challenge.startDate).toISOString().split('T')[0];
            startDateInput.disabled = true;  // 禁用输入框
            
            // 更新其他UI元素
            showRecordForm();
            updateCountdown();
            initializeChart();
            
            // 更新按钮显示状态
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('giveupBtn').style.display = 'block';
        } else {
            console.log('Challenge has ended');
            localStorage.removeItem('challenge');
            challengeActive = false;
            
            // 重置开始日期输入框
            const startDateInput = document.getElementById('startDate');
            startDateInput.value = '';
            startDateInput.disabled = false;  // 启用输入框
        }
    } else {
        console.log('No challenge data found');
        // 确保开始日期输入框可用
        const startDateInput = document.getElementById('startDate');
        startDateInput.disabled = false;
    }
}

// 开始挑战
function startChallenge() {
    const startDateInput = document.getElementById('startDate');
    const selectedStartDate = new Date(startDateInput.value);
    
    // 如果没有选择日期，使用当前时间
    const startDate = startDateInput.value ? selectedStartDate.getTime() : Date.now();
    const endDate = startDate + 30 * 24 * 60 * 60 * 1000;
    
    localStorage.setItem('challenge', JSON.stringify({
        startDate,
        endDate,
        records: []
    }));
    
    challengeActive = true;
    
    // 禁用开始日期输入框
    startDateInput.disabled = true;
    
    // 更新其他UI...
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    showRecordForm();
    updateCountdown();
    initializeChart();
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('giveupBtn').style.display = 'block';
}

// 更新倒计时
function updateCountdown() {
    if (!challengeActive) {
        updateButtonStates();
        return;
    }
    
    const challenge = JSON.parse(localStorage.getItem('challenge'));
    const remaining = Math.ceil((challenge.endDate - Date.now()) / (1000 * 60 * 60 * 24));
    
    document.getElementById('countdown').textContent = 
        remaining > 0 ? `剩余天数：${remaining}天` : "挑战完成！";
    
    if (remaining <= 0) {
        challengeActive = false;
    } else {
        setTimeout(updateCountdown, 1000 * 60 * 60); // 每小时更新一次
    }
}

// 提交记录
function submitRecord() {
    const weight = parseFloat(document.getElementById('weight').value);
    
    // 收集饮食数据
    const dietData = {
        breakfast: {
            calories: parseFloat(document.getElementById('breakfastCal').value) || 0,
            desc: document.getElementById('breakfastDesc').value
        },
        lunch: {
            calories: parseFloat(document.getElementById('lunchCal').value) || 0,
            desc: document.getElementById('lunchDesc').value
        },
        dinner: {
            calories: parseFloat(document.getElementById('dinnerCal').value) || 0,
            desc: document.getElementById('dinnerDesc').value
        },
        snack: {
            calories: parseFloat(document.getElementById('snackCal').value) || 0,
            desc: document.getElementById('snackDesc').value
        }
    };

    // 数据验证
    if (!weight) {
        alert("请填写体重");
        return;
    }

    // 计算总饮食热量
    const totalCalories = dietData.breakfast.calories + dietData.lunch.calories + dietData.dinner.calories + dietData.snack.calories;

    // 计算热量缺口
    const bmr = parseFloat(document.getElementById('bmr').textContent) || 0;
    const calorieDeficit = bmr - totalCalories;

    // 保存数据到localStorage
    const challenge = JSON.parse(localStorage.getItem('challenge'));
    const currentDate = document.getElementById('recordDate').value;
    
    // 更新记录
    const recordIndex = challenge.records.findIndex(r => r.date === currentDate);
    if (recordIndex > -1) {
        challenge.records[recordIndex] = {
            date: currentDate,
            weight,
            calorieDeficit, // 保存计算出的热量缺口
            diet: dietData
        };
    } else {
        challenge.records.push({
            date: currentDate,
            weight,
            calorieDeficit, // 保存计算出的热量缺口
            diet: dietData
        });
    }

    localStorage.setItem('challenge', JSON.stringify(challenge));
    updateChart();
    calculateTotalCalories(); // 更新总热量统计
    alert("记录已保存！");
}

// 新增天数计算函数
function updateDayCounter() {
    const challenge = JSON.parse(localStorage.getItem('challenge'));
    const startDate = new Date(challenge.startDate);
    const currentDate = new Date();
    const day = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('currentDay').textContent = `第${day}天`;
}

// 初始化图表
function initializeChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    const data = getChartData();
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: '体重 (kg)',
                    data: data.weights,
                    borderColor: '#4CAF50',
                    backgroundColor: '#4CAF50',
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: '热量缺口 (kcal)',
                    data: data.calories,
                    borderColor: '#FF6384',
                    backgroundColor: '#FF6384',
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '体重 (kg)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '热量缺口 (kcal)'
                    },
                    grid: {
                        drawOnChartArea: false // 只显示右侧刻度，不显示网格线
                    }
                }
            }
        }
    });
}

// 更新图表
function updateChart() {
    const data = getChartData();
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.weights;
    chart.data.datasets[1].data = data.calories;
    chart.update();
}

// 获取图表数据
function getChartData() {
    const challenge = JSON.parse(localStorage.getItem('challenge')) || { records: [] };
    
    // 按日期排序记录
    const sortedRecords = challenge.records.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    return {
        labels: sortedRecords.map(r => r.date),
        weights: sortedRecords.map(r => r.weight),
        calories: sortedRecords.map(r => r.calorieDeficit) // 添加热量缺口数据
    };
}

// 放弃挑战
function giveUpChallenge() {
    if (confirm("确定要放弃挑战吗？")) {
        localStorage.removeItem('challenge');
        challengeActive = false;
        document.getElementById('recordForm').style.display = 'none';
        document.getElementById('countdown').textContent = "挑战已放弃";
        if (chart) chart.destroy();
        updateButtonStates();
    }
}

function showRecordForm() {
    const recordForm = document.getElementById('recordForm');
    recordForm.style.display = 'block';
    
    // 获取挑战数据
    const challenge = JSON.parse(localStorage.getItem('challenge')) || { records: [] };
    
    // 获取输入框元素
    const weightInput = document.getElementById('weight');
    const calorieInput = document.getElementById('calorieDeficit');
    const dateInput = document.getElementById('recordDate');
    
    if (challengeActive) {
        // 如果挑战已开始，启用输入框
        weightInput.disabled = false;
        calorieInput.disabled = false;
        dateInput.disabled = false;
        
        // 设置日期输入框的最小值为开始日期，最大值为今天
        const startDate = new Date(challenge.startDate);
        const today = new Date();
        dateInput.min = startDate.toISOString().split('T')[0];
        dateInput.max = today.toISOString().split('T')[0];
        
        // 默认选择今天的日期
        dateInput.value = today.toISOString().split('T')[0];
        
        // 显示最新记录
        if (challenge.records.length > 0) {
            const lastRecord = challenge.records[challenge.records.length - 1];
            document.getElementById('lastWeight').textContent = 
                `上次记录：${lastRecord.weight}kg (${lastRecord.date})`;
            if (lastRecord.calorieDeficit) {
                document.getElementById('lastCalorie').textContent = 
                    `上次热量缺口：${lastRecord.calorieDeficit}kcal`;
            }
        }
    } else {
        // 如果挑战未开始，禁用输入框
        weightInput.disabled = true;
        calorieInput.disabled = true;
        dateInput.disabled = true;
        
        // 清空显示
        document.getElementById('lastWeight').textContent = '';
        document.getElementById('lastCalorie').textContent = '';
    }
}

// 新增记录日期改变监听
document.getElementById('recordDate').addEventListener('change', function() {
    loadRecordData(this.value);
});

// 新增加载记录数据函数
function loadRecordData(dateStr) {
    const challenge = JSON.parse(localStorage.getItem('challenge'));
    const record = challenge.records.find(r => r.date === dateStr);
    
    // 加载体重数据
    if (record) {
        document.getElementById('weight').value = record.weight || '';
        
        // 更新热量缺口（只读）
        document.getElementById('calorieDeficit').value = record.calorieDeficit || '';

        // 新增：加载饮食数据
        if (record.diet) {
            document.getElementById('breakfastCal').value = record.diet.breakfast?.calories || '';
            document.getElementById('breakfastDesc').value = record.diet.breakfast?.desc || '';
            document.getElementById('lunchCal').value = record.diet.lunch?.calories || '';
            document.getElementById('lunchDesc').value = record.diet.lunch?.desc || '';
            document.getElementById('dinnerCal').value = record.diet.dinner?.calories || '';
            document.getElementById('dinnerDesc').value = record.diet.dinner?.desc || '';
            document.getElementById('snackCal').value = record.diet.snack?.calories || '';
            document.getElementById('snackDesc').value = record.diet.snack?.desc || '';
        } else {
            // 如果当天饮食没有数据，清空饮食输入框
            document.getElementById('breakfastCal').value = '';
            document.getElementById('breakfastDesc').value = '';
            document.getElementById('lunchCal').value = '';
            document.getElementById('lunchDesc').value = '';
            document.getElementById('dinnerCal').value = '';
            document.getElementById('dinnerDesc').value = '';
            document.getElementById('snackCal').value = '';
            document.getElementById('snackDesc').value = '';
        }
    } else {
        // 清空所有输入框
        document.getElementById('weight').value = '';
        document.getElementById('calorieDeficit').value = '';
        document.getElementById('breakfastCal').value = '';
        document.getElementById('breakfastDesc').value = '';
        document.getElementById('lunchCal').value = '';
        document.getElementById('lunchDesc').value = '';
        document.getElementById('dinnerCal').value = '';
        document.getElementById('dinnerDesc').value = '';
        document.getElementById('snackCal').value = '';
        document.getElementById('snackDesc').value = '';
    }
    
    // 更新天数显示
    const startDate = new Date(challenge.startDate);
    const currentDate = new Date(dateStr);
    const day = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('currentDay').textContent = `第${day}天`;
}

// 新增按钮状态更新函数
function updateButtonStates() {
    const challenge = JSON.parse(localStorage.getItem('challenge'));
    const hasActiveChallenge = challenge && challenge.endDate > Date.now();
    
    document.getElementById('startBtn').disabled = hasActiveChallenge;
    document.getElementById('giveupBtn').disabled = !hasActiveChallenge;
}

// 显示主页面
function showMainPage() {
    document.getElementById('profilePage').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    document.getElementById('profileButton').style.display = 'block';
    updateProfileSummary();
}

// 显示个人信息页面
function showProfilePage() {
    document.getElementById('profilePage').style.display = 'block';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('profileButton').style.display = 'none';
    loadProfile();
}

// 计算基础代谢率和每日消耗
function calculateBMR() {
    const gender = document.getElementById('gender').value;
    const age = parseFloat(document.getElementById('age').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    const weight = parseFloat(document.getElementById('profileWeight').value) || 0;
    const activityLevel = parseFloat(document.getElementById('activityLevel').value) || 1.2;
    
    let bmr = 0;
    
    // 使用Mifflin-St Jeor公式计算BMR
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // 计算TDEE（每日总能量消耗）
    const tdee = bmr * activityLevel;
    
    // 计算建议的减重热量摄入（减去500-1000卡路里）
    const suggested = Math.max(1200, tdee - 500);
    
    // 显示结果
    document.getElementById('bmr').textContent = Math.round(bmr);
    document.getElementById('tdee').textContent = Math.round(tdee);
    document.getElementById('suggested').textContent = Math.round(suggested);
    
    // 保存个人信息
    saveProfile();
}

// 保存个人信息
function saveProfile() {
    const profile = {
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('profileWeight').value,
        activityLevel: document.getElementById('activityLevel').value
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profile));
}

// 加载个人信息
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    if (profile) {
        document.getElementById('gender').value = profile.gender;
        document.getElementById('age').value = profile.age;
        document.getElementById('height').value = profile.height;
        document.getElementById('profileWeight').value = profile.weight;
        document.getElementById('activityLevel').value = profile.activityLevel;
        
        calculateBMR();
    }
}

// 更新个人信息摘要
function updateProfileSummary() {
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    if (profile) {
        document.getElementById('summaryGender').textContent = 
            `性别: ${profile.gender === 'male' ? '男' : '女'}`;
        document.getElementById('summaryAge').textContent = 
            `年龄: ${profile.age}岁`;
        document.getElementById('summaryHeight').textContent = 
            `身高: ${profile.height}cm`;
        document.getElementById('summaryWeight').textContent = 
            `体重: ${profile.weight}kg`;
        document.getElementById('summaryBMR').textContent = 
            `基础代谢: ${document.getElementById('bmr').textContent}kcal/天`;
        
        // 显示摘要区域
        document.getElementById('profileSummary').style.display = 'block';
    } else {
        // 如果没有个人信息，隐藏摘要区域
        document.getElementById('profileSummary').style.display = 'none';
    }
}

// 保存并返回主页面
function saveAndReturn() {
    saveProfile();
    calculateBMR();
    updateProfileSummary();
    showMainPage();
}

// 取消并返回主页面
function cancelAndReturn() {
    if (confirm('确定要取消吗？未保存的更改将丢失。')) {
        showMainPage();
        loadProfile(); // 重新加载之前保存的数据
    }
}

// 新增饮食记录相关函数
function showDietForm() {
    document.getElementById('dietModal').style.display = 'block';
}

function closeDietForm() {
    document.getElementById('dietModal').style.display = 'none';
}

function submitDietForm(e) {
    e.preventDefault();
    // 收集各餐数据
    const dietData = {
        date: new Date().toLocaleDateString(),
        meals: {
            breakfast: {
                calories: document.getElementById('breakfastCal').value,
                desc: document.getElementById('breakfastDesc').value
            },
            lunch: {
                calories: document.getElementById('lunchCal').value,
                desc: document.getElementById('lunchDesc').value
            },
            dinner: {
                calories: document.getElementById('dinnerCal').value,
                desc: document.getElementById('dinnerDesc').value
            },
            snack: {
                calories: document.getElementById('snackCal').value,
                desc: document.getElementById('snackDesc').value
            }
        }
    };
    
    // 保存到localStorage
    localStorage.setItem('dietRecord_' + dietData.date, JSON.stringify(dietData));
    
    // 更新总热量显示
    calculateTotalCalories();
    closeDietForm();
}

function calculateTotalCalories() {
    let total = 0;
    // 从localStorage读取数据计算
    const dietRecords = JSON.parse(localStorage.getItem('dietRecord_' + new Date().toLocaleDateString())) || {};
    for (const meal in dietRecords.meals) {
        total += parseFloat(dietRecords.meals[meal].calories) || 0;
    }
    document.getElementById('totalCalories').textContent = Math.round(total);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    init();
    loadProfile();
    updateProfileSummary();
});