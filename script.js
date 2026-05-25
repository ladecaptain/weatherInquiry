// script.js (桌面端优化版)

// 获取HTML元素
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfoDiv = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');

// "和风天气"获取的API密钥
const apiKey = 'a8482d925cc44a749e9d77a8114c5f79';
// 为按钮添加点击事件，并调用主函数
searchBtn.addEventListener('click', searchWeather);

// 实现按回车键也能搜索
cityInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchWeather();
    }
});

/**
 * 主函数 - 处理整个天气查询流程
 */
async function searchWeather() {
    const cityName = cityInput.value.trim();
    if (cityName === '') {
        alert('请输入一个城市名！');
        return;
    }

    // 在开始查询前，显示加载提示
    weatherInfoDiv.innerHTML = `<p>正在查询中...</p>`;
    forecastContainer.innerHTML = `<p>正在加载天气预报...</p>`;

    try {
        // 第一步：用城市名获取城市ID
        const cityLookupUrl = `https://mt63yw2ku6.re.qweatherapi.com/geo/v2/city/lookup?location=${cityName}&key=${apiKey}`;
        
        const cityResponse = await fetch(cityLookupUrl);
        const cityData = await cityResponse.json();

        // 检查城市ID是否获取成功
        if (cityData.code !== "200" || !cityData.location || cityData.location.length === 0) {
            throw new Error('找不到该城市，请检查输入是否正确。');
        }

        // 提取城市ID和名称
        const locationId = cityData.location[0].id;
        const exactCityName = cityData.location[0].name;

        // 第二步：并行获取实时天气和天气预报
        const [currentWeather, forecastWeather] = await Promise.all([
            fetchCurrentWeather(locationId),
            fetchWeatherForecast(locationId)
        ]);

        // 第三步：显示天气信息
        displayCurrentWeather(currentWeather.now, exactCityName);
        displayForecast(forecastWeather.daily);

    } catch (error) {
        // 统一处理错误
        console.error('查询天气时出错:', error);
        weatherInfoDiv.innerHTML = `<p>${error.message}</p>`;
        forecastContainer.innerHTML = `<p>获取天气预报失败</p>`;
    }
}

/**
 * 获取实时天气数据
 */
async function fetchCurrentWeather(locationId) {
    const weatherUrl = `https://mt63yw2ku6.re.qweatherapi.com/v7/weather/now?location=${locationId}&key=${apiKey}`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    
    if (data.code !== "200") {
        throw new Error('获取实时天气信息失败。');
    }
    
    return data;
}

/**
 * 获取天气预报数据
 */
async function fetchWeatherForecast(locationId) {
    const forecastUrl = `https://mt63yw2ku6.re.qweatherapi.com/v7/weather/7d?location=${locationId}&key=${apiKey}`;
    const response = await fetch(forecastUrl);
    const data = await response.json();
    
    if (data.code !== "200") {
        throw new Error('获取天气预报信息失败。');
    }
    
    return data;
}


/**
 * 显示实时天气信息
 */
function displayCurrentWeather(nowData, cityName) {
    const temperature = nowData.temp;
    const feelsLike = nowData.feelsLike;
    const weatherDescription = nowData.text;
    const weatherIcon = nowData.icon;
    const time = nowData.obsTime;
    const humidity = nowData.humidity;
    const windDir = nowData.windDir;
    const windScale = nowData.windScale;
    const iconUrl = `./icons/${weatherIcon}.svg`;

    // 格式化时间
    const updateTime = formatTime(time);

    weatherInfoDiv.innerHTML = `
        <h2>${cityName}</h2>
        <p class="update-time">更新时间: ${updateTime}</p>
        <img src="${iconUrl}" alt="${weatherDescription}">
        <p class="temperature">${temperature}°C</p>
        <p class="weather-desc">${weatherDescription}</p>
        <p>体感温度: ${feelsLike}°C</p>
        <div class="weather-details">
            <div class="detail-item">
                <span class="detail-label">湿度</span>
                <span class="detail-value">${humidity}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">风向</span>
                <span class="detail-value">${windDir}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">风力</span>
                <span class="detail-value">${windScale}级</span>
            </div>
        </div>
    `;
    
    // 根据天气状况设置背景图片
    setWeatherBackground(weatherDescription);
    
    // 更新当前天气卡片样式
    updateCurrentWeatherCardStyle(weatherDescription);
}

/**
 * 显示天气预报信息
 */
function displayForecast(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        forecastContainer.innerHTML = '<p>暂无天气预报数据</p>';
        return;
    }

    let forecastHTML = '';
    
    // 获取今天的日期，用于标记"今天"和"明天"
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    // 为每一天创建预报卡片
    dailyData.forEach((day, index) => {
        const date = day.fxDate;
        const dayOfWeek = getDayOfWeek(date);
        const displayDate = date === todayStr ? '今天' : 
                           date === tomorrowStr ? '明天' : 
                           dayOfWeek;
        
        // 获取天气类型对应的背景色和边框色
        const cardBgColor = getWeatherCardColor(day.textDay);
        const borderColor = getWeatherColor(day.textDay);
        
        forecastHTML += `
            <div class="forecast-day" style="background-color: ${cardBgColor}; border-left: 4px solid ${borderColor}">
                <div class="forecast-date">${displayDate}</div>
                <img class="forecast-icon" src="./icons/${day.iconDay}.svg" alt="${day.textDay}">
                <div class="forecast-desc">${day.textDay}</div>
                <div class="forecast-temp">
                    <span class="forecast-high">${day.tempMax}°</span>
                    <span class="forecast-low">${day.tempMin}°</span>
                </div>
            </div>
        `;
    });

    forecastContainer.innerHTML = forecastHTML;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 根据日期获取星期几
 */
function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
}

/**
 * 格式化时间显示
 */
function formatTime(timeString) {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * 根据天气状况设置背景图片
 */
function setWeatherBackground(weatherDesc) {
    const weatherType = weatherDesc.toLowerCase();
    let backgroundImage = '';
    
    // 根据天气描述设置背景图片（支持中英文天气描述）
    if (weatherType.includes('rain') || weatherType.includes('drizzle') || weatherType.includes('雨')) {
        backgroundImage = 'https://tc-new.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/Ny4i/612X408/rainy.jpg';
    } else if ((weatherType.includes('clear') || weatherType.includes('sun') || weatherType.includes('晴')) && !weatherType.includes('cloud') && !weatherType.includes('多云')) {
        backgroundImage = 'https://tc.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/TgXm/1920X1080/sunny.jpg';
    } else if (weatherType.includes('cloud') || weatherType.includes('overcast') || weatherType.includes('多云') || weatherType.includes('阴')) {
        backgroundImage = 'https://tc-new.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/YfJW/540X360/cloudy.jpg';
    } else if (weatherType.includes('snow') || weatherType.includes('雪')) {
        backgroundImage = 'https://tc-new.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/F4MJ/1024X697/snowy.jpg';
    } else if (weatherType.includes('thunder') || weatherType.includes('storm') || weatherType.includes('lightning') || weatherType.includes('雷') || weatherType.includes('闪电')) {
        backgroundImage = 'https://tc.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/Rn8X/474X313/leitian.webp';
    } else if (weatherType.includes('fog') || weatherType.includes('mist') || weatherType.includes('haze') || weatherType.includes('雾') || weatherType.includes('霾')) {
        backgroundImage = 'https://tc.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/0DJE/700X398/%E9%9B%BE%E9%9C%BE.jpg';
    } else {
        // 默认背景图片
        backgroundImage = 'https://tc.z.wiki/autoupload/f/I52rW2iUJFZLBJDpySwU0Kafo_6-hTJekmBMO9zizzGyl5f0KlZfm6UsKj-HyTuv/20250910/TgXm/1920X1080/sunny.jpg';
    }
    
    // 设置背景图片
    document.body.style.backgroundImage = `url(${backgroundImage})`;
}
/**
 * 更新当前天气卡片样式
 */
function updateCurrentWeatherCardStyle(weatherDesc) {
    const currentWeatherCard = document.querySelector('.current-weather');
    if (currentWeatherCard) {
        currentWeatherCard.style.transition = 'all 0.5s ease';
        
        // 设置边框颜色
        const bgColor = getWeatherColor(weatherDesc);
        currentWeatherCard.style.borderLeftColor = bgColor;
        currentWeatherCard.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        currentWeatherCard.style.backdropFilter = 'blur(10px)';
        currentWeatherCard.style.borderLeft = `5px solid ${bgColor}`;
    }
    
    // 更新预报卡片的样式
    const forecastCard = document.querySelector('.forecast');
    if (forecastCard) {
        forecastCard.style.transition = 'all 0.5s ease';
        forecastCard.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        forecastCard.style.backdropFilter = 'blur(10px)';
    }
}

/**
 * 获取天气对应的颜色
 */
function getWeatherColor(weatherDesc) {
    // 根据天气描述设置背景色
    if (weatherDesc.includes('晴') && !weatherDesc.includes('多云')) {
        return '#e6f7ff'; // 淡蓝色 - 晴天
    } else if (weatherDesc.includes('多云')) {
        return '#f0f0f0'; // 浅灰色 - 多云
    } else if (weatherDesc.includes('阴')) {
        return '#e0e0e0'; // 灰色 - 阴天
    } else if (weatherDesc.includes('雨')) {
        return '#e6f0f5'; // 淡青灰色 - 雨天
    } else if (weatherDesc.includes('雪')) {
        return '#f5f5f5'; // 白色 - 雪天
    } else if (weatherDesc.includes('雾') || weatherDesc.includes('霾')) {
        return '#f0f2f5'; // 雾霾天
    } else if (weatherDesc.includes('沙尘')) {
        return '#faf3e0'; // 沙尘天
    } else if (weatherDesc.includes('雷') || weatherDesc.includes('闪电')) {
        return '#e9ecef'; // 雷电天
    } else {
        // 默认背景色
        return '#f0f8ff';
    }
}

/**
 * 获取天气卡片的背景色
 */
function getWeatherCardColor(weatherDesc) {
    const baseColor = getWeatherColor(weatherDesc);
    // 将颜色转换为半透明版本
    return baseColor.replace('#', 'rgba(') + ', 0.2)';
}