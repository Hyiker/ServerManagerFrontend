import React, { useState, useEffect } from "react";
import { Card, Typography, Row, Col, Divider, Tag, Spin } from "antd";
import {
  StarOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  HeartOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

// --- 核心运势生成逻辑 ---

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

// 2. 运势数据
const luckLevels = {
  大吉: {
    text: "大吉",
    color: "#ff4d4f",
    icon: <StarOutlined />,
    advice: "今日万事皆宜，如有神助！放手去做吧！",
  },
  中吉: {
    text: "中吉",
    color: "#faad14",
    icon: <SmileOutlined />,
    advice: "平稳顺遂，偶有惊喜。保持平常心，好运自来。",
  },
  小吉: {
    text: "小吉",
    color: "#1890ff",
    icon: <MehOutlined />,
    advice: "偶有挑战，但总体向上。努力一点，能有所获。",
  },
  凶: {
    text: "凶",
    color: "#8c8c8c",
    icon: <FrownOutlined />,
    advice: "诸事不顺，请低调行事，避免重大决策。",
  },
};

const quotes = [
  // --- 编程与开发 ---
  "“Talk is cheap. Show me the code.” - Linus Torvalds",
  "“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” - Martin Fowler",
  "“First, solve the problem. Then, write the code.” - John Johnson",
  "“Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.” - Brian Kernighan",
  "“There are only two hard things in Computer Science: cache invalidation and naming things.” - Phil Karlton",
  "“Code is like humor. When you have to explain it, it’s bad.” - Cory House",
  "“Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.” - John Woods",
  "“Weeks of programming can save you hours of planning.” - Unknown",
  "“It's not a bug, it's an undocumented feature.” - Anonymous",

  // --- 科研与探索 ---
  "“The best way to predict the future is to invent it.” - Alan Kay",
  "“The most exciting phrase to hear in science, the one that heralds new discoveries, is not ‘Eureka!’ but ‘That’s funny...’” - Isaac Asimov",
  "“The important thing is not to stop questioning. Curiosity has its own reason for existing.” - Albert Einstein",
  "“A person who never made a mistake never tried anything new.” - Albert Einstein",
  "“The first principle is that you must not fool yourself and you are the easiest person to fool.” - Richard Feynman",
  "“Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.” - Marie Curie",

  // --- 创新与思想 ---
  "“Stay hungry, stay foolish.” - Steve Jobs",
  "“Your most unhappy customers are your greatest source of learning.” - Bill Gates",
  "“Measuring programming progress by lines of code is like measuring aircraft building progress by weight.” - Bill Gates",
  "“Simplicity is the ultimate sophistication.” - Leonardo da Vinci",
  "“Innovation distinguishes between a leader and a follower.” - Steve Jobs",

  // --- 幽默与现实 ---
  "“The first 90% of the code accounts for the first 90% of the development time. The remaining 10% of the code accounts for the other 90% of the development time.” - Tom Cargill",
  "“There’s no place like 127.0.0.1” - Anonymous",
  "“To err is human, but to really foul things up you need a computer.” - Paul R. Ehrlich",
  "“Coffee: the programmer’s best friend.” - Anonymous",
  "“One man’s crappy software is another man’s full-time job.” - Jessica Gaston",
];

const FortunePage = () => {
  const [fortune, setFortune] = useState(null);
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    // 模拟一个短暂的“掐指推算”过程
    const timer = setTimeout(() => {
      // 3. 生成每日固定的种子
      const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const seed = `${username}-${date}`;
      const random = seededRandom(seed);

      // 4. 根据种子生成各项运势

      // - 决定运势等级
      const luckKeys = Object.keys(luckLevels);
      const todayLuckKey = luckKeys[Math.floor(random() * luckKeys.length)];
      const todayLuck = luckLevels[todayLuckKey];

      // - 决定是否宜租卡
      const rentGpuChance = random();
      const shouldRentGpu = rentGpuChance > 0.4; // 60%的几率宜租卡
      const gpuCount = shouldRentGpu ? (Math.floor(random() * 4) + 1) * 2 : 0; // 租2, 4, 6, 8张

      // - 决定是否宜科研
      const researchChance = random();
      const shouldDoResearch = researchChance > 0.35; // 65%的几率宜科研

      // - 决定幸运箴言
      const luckyQuote = quotes[Math.floor(random() * quotes.length)];

      setFortune({
        luck: todayLuck,
        gpu: {
          should: shouldRentGpu,
          count: gpuCount,
        },
        research: {
          should: shouldDoResearch,
        },
        quote: luckyQuote,
      });
    }, 500); // 500ms的延迟，增加仪式感

    return () => clearTimeout(timer); // 清理定时器
  }, [username]); // 当用户名变化时重新计算

  // 加载中状态
  if (!fortune) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Spin tip="正在为您掐指推算今日运势..." size="large" />
      </div>
    );
  }

  return (
    <div
      className="fortune-page"
      style={{ padding: "24px", maxWidth: "800px", margin: "auto" }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "10px" }}>
        <HeartOutlined /> {username}, 这是你今天的运势
      </Title>
      <Paragraph
        style={{ textAlign: "center", color: "#888", marginBottom: "30px" }}
      >
        每日运势基于您的用户名和日期生成，祝您好运！
      </Paragraph>

      <Card hoverable>
        <div style={{ textAlign: "center" }}>
          <Text style={{ fontSize: "18px", color: "#555" }}>今日运势</Text>
          <Title
            level={1}
            style={{
              color: fortune.luck.color,
              fontSize: "80px",
              margin: "10px 0",
              letterSpacing: "8px",
            }}
          >
            {fortune.luck.text}
          </Title>
          <Paragraph style={{ fontStyle: "italic", color: "#666" }}>
            {fortune.luck.advice}
          </Paragraph>
        </div>

        <Divider />

        <Row gutter={[16, 24]} align="middle" style={{ textAlign: "center" }}>
          <Col xs={24} md={12}>
            <Title level={5}>
              <DesktopOutlined /> GPU预约
            </Title>
            {fortune.gpu.should ? (
              <>
                <Tag
                  color="success"
                  style={{ fontSize: "16px", padding: "5px 10px" }}
                >
                  宜租卡
                </Tag>
                <Paragraph style={{ marginTop: "10px" }}>
                  今日手气旺，建议租用{" "}
                  <Text strong style={{ color: "#cf1322", fontSize: "18px" }}>
                    {fortune.gpu.count}
                  </Text>{" "}
                  张GPU，事半功倍！
                </Paragraph>
              </>
            ) : (
              <>
                <Tag
                  color="error"
                  style={{ fontSize: "16px", padding: "5px 10px" }}
                >
                  忌租卡
                </Tag>
                <Paragraph style={{ marginTop: "10px" }}>
                  服务器可能与你八字不合，建议今日休养生息。
                </Paragraph>
              </>
            )}
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>
              <ExperimentOutlined /> 科学研究
            </Title>
            {fortune.research.should ? (
              <>
                <Tag
                  color="success"
                  style={{ fontSize: "16px", padding: "5px 10px" }}
                >
                  宜科研
                </Tag>
                <Paragraph style={{ marginTop: "10px" }}>
                  灵感如泉涌，是攻克难题、发表顶会的好时机！
                </Paragraph>
              </>
            ) : (
              <>
                <Tag
                  color="default"
                  style={{ fontSize: "16px", padding: "5px 10px" }}
                >
                  忌科研
                </Tag>
                <Paragraph style={{ marginTop: "10px" }}>
                  思路可能受阻，不如看看文档，调调超参。
                </Paragraph>
              </>
            )}
          </Col>
        </Row>

        <Divider>
          <StarOutlined />
        </Divider>

        <Paragraph
          style={{ textAlign: "center", fontStyle: "italic", color: "#888" }}
        >
          <Text strong>今日幸运箴言:</Text> {fortune.quote}
        </Paragraph>
      </Card>

      <Paragraph
        style={{
          textAlign: "center",
          marginTop: "20px",
          color: "#aaa",
          fontSize: "12px",
        }}
      >
        *本结果仅供娱乐，请勿用于指导关键性科研决策。
      </Paragraph>
    </div>
  );
};

export default FortunePage;
