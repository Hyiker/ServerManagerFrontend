import React, { useState, useEffect } from "react";
// 1. 导入 Button 和 Tooltip, 以及新的图标
import { Card, Typography, Spin, Tabs, List, Avatar, Button, Tooltip } from "antd";
import {
    ShopOutlined,
    CoffeeOutlined,
    RestOutlined,
    FireOutlined,
    RedoOutlined, // Roll 按钮图标
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

// 1. 基于字符串种子的伪随机数生成器
// 确保对于相同的输入（种子），输出总是相同的
const seededRandom = (seed) => {
    let h = 1777773; // 一个魔术常数
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
};
// 2. 菜品数据源 (扩充版)
const breakfastOptions = [
    // --- 经典组合 (Classic Combos) ---
    "豆浆油条",
    "豆浆配包子",
    "小米粥配咸菜",
    "白粥配腐乳",
    "豆腐脑配油条",
    // --- 面点/主食 (Staples & Pastries) ---
    "猪肉大葱包",
    "三鲜包",
    "韭菜鸡蛋包",
    "香菇青菜包",
    "豆沙包",
    "奶黄包",
    "鲜肉小笼包",
    "蟹黄小笼包",
    "生煎包",
    "水煎包",
    "花卷",
    "馒头",
    "葱油饼",
    "手抓饼",
    "鸡蛋灌饼",
    "酱香饼",
    "千层饼",
    "老婆饼",
    "牛肉饼",
    "煎饼果子",
    "烧麦",
    "糯米烧麦",
    "锅贴",
    "油饼",
    "糖油饼",
    "麻团",
    "发糕",
    "窝窝头",
    // --- 粥类 (Congee & Porridge) ---
    "皮蛋瘦肉粥",
    "八宝粥",
    "南瓜粥",
    "绿豆粥",
    "红豆薏米粥",
    "黑米粥",
    "海鲜粥",
    "鸡肉粥",
    "蔬菜粥",
    "燕麦粥",
    // --- 粉面/汤类 (Noodles & Soups) ---
    "小馄饨",
    "鲜肉馄饨",
    "虾仁馄饨",
    "红油抄手",
    "清汤面",
    "雪菜肉丝面",
    "阳春面",
    "重庆小面",
    "热干面",
    "担担面",
    "片儿川",
    "酸辣粉",
    "胡辣汤",
    "豆汁儿焦圈",
    "羊肉汤",
    "牛肉汤",
    // --- 蛋/米制品 (Egg & Rice) ---
    "茶叶蛋",
    "煮鸡蛋",
    "荷包蛋",
    "蒸蛋羹",
    "咸鸭蛋",
    "肠粉",
    "虾仁肠粉",
    "牛肉肠粉",
    "粢饭团",
    "糯米鸡",
    "炒米粉",
    "酒酿圆子",
    // --- 地方特色 (Regional Specialties) ---
    "广式早茶全套",
    "天津豆腐脑",
    "武汉豆皮",
    "西安甄糕",
    "上海四大金刚 (大饼、油条、豆浆、粢饭)",
    "长沙米粉",
    "柳州螺蛳粉 (早餐版)",
    "桂林米粉",
    "厦门沙茶面",
    "福州锅边糊",
    // --- 现代/便捷 (Modern & Quick) ---
    "三明治",
    "牛奶配麦片",
    "烤面包",
    "紫薯",
    "蒸玉米",
    "手抓饼里脊",
    "肉夹馍",
    "煮地瓜",
    "烤红薯",
    "速冻水饺",
    "速冻汤圆",
    "燕麦片",
    "银耳莲子羹",
    "醪糟鸡蛋",
];
const mainCourseOptions = [
    // --- 经典炒菜 (Classic Stir-fries) ---
    "宫保鸡丁",
    "鱼香肉丝",
    "麻婆豆腐",
    "回锅肉",
    "西红柿炒鸡蛋",
    "青椒肉丝",
    "木须肉",
    "蒜苔炒肉",
    "京酱肉丝",
    "地三鲜",
    "干煸四季豆",
    "农家小炒肉",
    "小炒黄牛肉",
    "辣子鸡",
    "孜然羊肉",
    "葱爆羊肉",
    "酸辣土豆丝",
    "清炒西兰花",
    "手撕包菜",
    "油焖大虾",
    "辣炒花蛤",
    "韭菜炒河虾",
    "麻辣香锅",
    "干锅包菜",
    "干锅茶树菇",
    "干锅肥肠",
    "干锅牛蛙",
    // --- 硬菜/炖菜 (Hard Dishes & Stews) ---
    "红烧肉",
    "东坡肉",
    "糖醋排骨",
    "红烧排骨",
    "粉蒸肉",
    "梅菜扣肉",
    "小鸡炖蘑菇",
    "大盘鸡",
    "啤酒鸭",
    "可乐鸡翅",
    "三杯鸡",
    "黄焖鸡",
    "红烧狮子头",
    "猪脚姜",
    "红烧牛腩",
    "土豆炖牛腩",
    "酸汤肥牛",
    "水煮牛肉",
    "水煮鱼",
    "酸菜鱼",
    "剁椒鱼头",
    "清蒸鲈鱼",
    "红烧带鱼",
    "松鼠鳜鱼",
    "烤鱼",
    "羊蝎子火锅",
    "猪肚鸡",
    "佛跳墙 (家庭版)",
    "铁锅炖大鹅",
    // --- 凉菜 (Cold Dishes) ---
    "拍黄瓜",
    "凉拌西红柿",
    "凉拌木耳",
    "口水鸡",
    "白切鸡",
    "夫妻肺片",
    "凉皮",
    "大拉皮",
    "皮蛋豆腐",
    "姜汁皮蛋",
    // --- 汤羹 (Soups) ---
    "西湖牛肉羹",
    "酸辣汤",
    "紫菜蛋花汤",
    "冬瓜排骨汤",
    "玉米排骨汤",
    "番茄牛尾汤",
    "罗宋汤",
    "鲫鱼豆腐汤",
    // --- 主食 (Staple Foods as a Meal) ---
    "兰州牛肉拉面",
    "山西刀削面",
    "陕西油泼面",
    "北京炸酱面",
    "武汉热干面",
    "宜宾燃面",
    "河南烩面",
    "扬州炒饭",
    "酱油炒饭",
    "猪肉白菜水饺",
    "三鲜水饺",
    "韭菜鸡蛋水饺",
    "牛肉水饺",
    "猪肉大葱馄饨",
    "荠菜馄饨",
    "盖浇饭 (任选)",
    "煲仔饭",
    "卤肉饭",
    "海南鸡饭",
    "手抓饭",
    "麻辣烫",
    "冒菜",
    // --- 烧烤/特色小吃 (BBQ & Snacks) ---
    "羊肉串",
    "烤鸡翅",
    "烤韭菜",
    "烤面筋",
    "烤茄子",
    "烤生蚝",
    "麻辣小龙虾",
    "蒜蓉小龙虾",
    "臭豆腐",
    "铁板豆腐",
    "章鱼小丸子",
    // --- 菜系特色 (Regional Cuisine Highlights) ---
    "白灼菜心",
    "豉汁蒸排骨",
    "咕咾肉",
    "锅包肉",
    "杀猪菜",
    "腌笃鲜",
    "油爆虾",
    "臭鳜鱼",
    "荔枝肉",
    "过桥米线",
    "椒麻鸡",
    "酿豆腐",
];
// 辅助函数：从数组中随机选择一个元素
const pickRandom = (array, randomFunc) => {
    if (!array || array.length === 0) return "选择困难";
    const index = Math.floor(randomFunc() * array.length);
    return array[index];
};

// 2. 新增：一个用于管理带有效期 localStorage 的辅助对象
const dailyStorage = {
    get: (key) => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date();
        // 检查 item 是否已过期
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    },
    set: (key, value) => {
        const now = new Date();
        // 设置过期时间为当天的午夜
        const expiry = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        const item = {
            value: value,
            expiry: expiry,
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
};

const MAX_ROLLS_PER_DAY = 5;

const WhatToEatPage = () => {
    const [meals, setMeals] = useState(null);
    const userId = localStorage.getItem("username") || "美食家";

    // 3. 新增 state 来管理 roll 次数
    const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS_PER_DAY);

    // 4. 将菜单生成逻辑提取到一个函数中，方便重用
    const generateMeals = () => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayDateStr = today.toISOString().slice(0, 10);
        const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);

        // 从 localStorage 读取今天的 roll 次数，如果不存在则为 0
        const rollsUsed = dailyStorage.get(`rollsUsed-${userId}-${todayDateStr}`) || 0;
        const rollsRemaining = MAX_ROLLS_PER_DAY - rollsUsed;
        setRollsLeft(rollsRemaining < 0 ? 0 : rollsRemaining);

        // 5. 将 roll 次数加入随机种子，确保每次 roll 结果都不同
        const todaySeed = `${userId}-${todayDateStr}-food-${rollsUsed}`;
        const tomorrowSeed = `${userId}-${tomorrowDateStr}-food-${rollsUsed}`; // 明天的也可以联动，更有趣

        const todayRandom = seededRandom(todaySeed);
        const tomorrowRandom = seededRandom(tomorrowSeed);

        const todayMeals = {
            breakfast: pickRandom(breakfastOptions, todayRandom),
            lunch: pickRandom(mainCourseOptions, todayRandom),
            dinner: pickRandom(mainCourseOptions, todayRandom),
        };

        const tomorrowMeals = {
            breakfast: pickRandom(breakfastOptions, tomorrowRandom),
            lunch: pickRandom(mainCourseOptions, tomorrowRandom),
            dinner: pickRandom(mainCourseOptions, tomorrowRandom),
        };

        setMeals({
            today: todayMeals,
            tomorrow: tomorrowMeals,
        });
    };

    // 页面加载时，执行一次菜单生成
    useEffect(() => {
        const timer = setTimeout(() => {
            generateMeals();
        }, 500);
        return () => clearTimeout(timer);
    }, [userId]); // 仅在 userId 变化时重新加载初始数据

    // 6. 处理 Roll 按钮点击事件
    const handleRoll = (mealType, day) => {
        if (rollsLeft <= 0) {
            return; // 没有机会了
        }

        const todayDateStr = new Date().toISOString().slice(0, 10);
        const storageKey = `rollsUsed-${userId}-${todayDateStr}`;

        // 更新已用次数
        const currentRollsUsed = dailyStorage.get(storageKey) || 0;
        dailyStorage.set(storageKey, currentRollsUsed + 1);

        // 重新生成所有餐食
        generateMeals();
    };


    // 加载中状态 (保持不变)
    if (!meals) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin tip="正在为您搭配今日菜单..." size="large" />
            </div>
        );
    }

    // 数据转换逻辑 (保持不变)
    const createMealData = (mealPlan) => [
        {
            type: '早餐',
            food: mealPlan.breakfast,
            icon: <CoffeeOutlined />,
            color: '#c41d7f', // 粉色
        },
        {
            type: '午餐',
            food: mealPlan.lunch,
            icon: <RestOutlined />,
            color: '#096dd9', // 蓝色
        },
        {
            type: '晚餐',
            food: mealPlan.dinner,
            icon: <FireOutlined />,
            color: '#d46b08', // 橙色
        },
    ];
    const todayMealData = createMealData(meals.today);
    const tomorrowMealData = createMealData(meals.tomorrow);

    // 7. 更新列表渲染函数，加入 Roll 按钮
    const renderMealList = (data, day) => (
        <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
                <List.Item
                    // 8. 使用 actions 属性添加右侧按钮
                    actions={[
                        day === 'today' && ( // 仅为今天提供 Roll 功能
                            <Tooltip title={`重新选择 (今日剩余 ${rollsLeft} 次)`}>
                                <Button
                                    shape="circle"
                                    icon={<RedoOutlined />}
                                    onClick={() => handleRoll(item.type, day)}
                                    disabled={rollsLeft <= 0}
                                />
                            </Tooltip>
                        )
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar size="large" style={{ backgroundColor: item.color }} icon={item.icon} />}
                        title={<Text strong>{item.type}</Text>}
                        description={<Title level={4} style={{ margin: 0, fontWeight: 400 }}>{item.food}</Title>}
                    />
                </List.Item>
            )}
        />
    );

    // 更新 Tabs items
    const tabItems = [
        {
            key: '1',
            label: `今天吃什么`,
            // 9. 传递 'today' 标识
            children: renderMealList(todayMealData, 'today'),
        },
        {
            key: '2',
            label: `明天吃什么`,
            // 明天没有 roll 功能
            children: renderMealList(tomorrowMealData, 'tomorrow'),
        },
    ];

    return (
        <div className="what-to-eat-page" style={{ padding: "24px", maxWidth: "700px", margin: "auto" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: "10px" }}>
                <ShopOutlined /> {userId}, 这是你的专属菜单
            </Title>
            <Paragraph style={{ textAlign: "center", color: "#888", marginBottom: "30px" }}>
                不满意？点右侧的骰子换一换！每日限5次。
            </Paragraph>

            <Card bordered={false} bodyStyle={{ padding: '1px 16px' }}>
                <Tabs defaultActiveKey="1" centered items={tabItems} />
            </Card>

            <Paragraph style={{ textAlign: "center", marginTop: "30px", color: "#aaa", fontSize: "12px" }}>
                *本结果仅为娱乐，请根据实际情况和个人口味选择，祝您用餐愉快！
            </Paragraph>
        </div>
    );
};

export default WhatToEatPage;
