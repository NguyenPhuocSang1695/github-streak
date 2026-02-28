const USERNAME = "GITHUB_USERNAME"; // username của trên GitHub
const GITHUB_TOKEN = "PASTE_TOKEN_HERE"; // token

// 🔥 gọi GraphQL
async function fetchContributions() {
  const query = `
  {
    user(login: "${USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const json = await res.json();

  if (!json.data || !json.data.user) {
    console.error("❌ GraphQL error:", json);
    return [];
  }

  return json.data.user.contributionsCollection
    .contributionCalendar.weeks
    .flatMap(w => w.contributionDays);
}

const getDateStr = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

const getContributionLevel = (count) => {
  if (count >= 10) return 4;
  if (count >= 5) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
};

// 🔥 tính streak + dữ liệu 7 ngày gần nhất
async function getStreakData() {
  const days = await fetchContributions();

  const map = new Map();
  days.forEach(d => map.set(d.date, d.contributionCount));

  let streak = 0;
  let current = new Date();

  const today = getDateStr(current);

  // ❗ nếu hôm nay không có commit → reset
  if ((map.get(today) || 0) === 0) {
    console.log("❌ No contribution today → streak = 0");
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = getDateStr(date);
      const count = map.get(dateStr) || 0;
      last7.push({ date: dateStr, count, level: getContributionLevel(count) });
    }
    return { streak: 0, last7 };
  }

  // 👉 tính liên tiếp
  while (true) {
    const dateStr = getDateStr(current);
    const count = map.get(dateStr) || 0;

    console.log("Check:", dateStr, "→", count);

    if (count > 0) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else break;
  }

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getDateStr(date);
    const count = map.get(dateStr) || 0;
    last7.push({ date: dateStr, count, level: getContributionLevel(count) });
  }

  return { streak, last7 };
}

// 🎨 render UI
function render(streakData) {
  const header = document.querySelector("header");
  if (!header) return;

  const { streak, last7 } = streakData;
  const titleText = `${streak} Day${streak === 1 ? "" : "s"} Active`;

  const levelColors = [
    "#1b1f2a",
    "#0e4429",
    "#006d32",
    "#26a641",
    "#39d353"
  ];

  let el = document.getElementById("streak-widget");

  if (el) {
    const title = el.querySelector("#streak-main-title");
    const dayLabel = el.querySelector("#streak-day-label");
    const days = el.querySelector("#streak-days");

    if (title) title.textContent = titleText;
    if (dayLabel) dayLabel.textContent = `Day ${streak}`;

    if (days) {
      days.innerHTML = "";
      last7.forEach((day, index) => {
        const dot = document.createElement("div");
        dot.style.width = "14px";
        dot.style.height = "14px";
        dot.style.borderRadius = "4px";
        dot.style.background = levelColors[day.level];
        dot.style.border = index === 6
          ? "1px solid rgba(255, 255, 255, 0.45)"
          : "1px solid rgba(255, 255, 255, 0.08)";
        days.appendChild(dot);
      });
    }

    return;
  }

  el = document.createElement("div");
  el.id = "streak-widget";
  el.innerHTML = `
    <div id="streak-icon-wrap">
      <div id="streak-icon-glow"></div>
      <div id="streak-icon">🔥</div>
    </div>
    <div id="streak-content">
      <div id="streak-main-title">${titleText}</div>
      <div id="streak-row">
        <span id="streak-last7">Last 7 days</span>
        <div id="streak-days"></div>
        <span id="streak-day-label">Day ${streak}</span>
      </div>
    </div>
  `;

  el.style.marginLeft = "12px";
  el.style.padding = "16px 18px";
  el.style.borderRadius = "14px";
  el.style.border = "1px solid rgba(255, 255, 255, 0.28)";
  el.style.background = "linear-gradient(140deg, rgba(255,140,59,0.24) 0%, rgba(20,24,34,0.96) 34%, rgba(17,20,30,0.98) 100%)";
  el.style.boxShadow = "0 10px 35px rgba(0,0,0,0.45), inset 0 0 24px rgba(255,140,59,0.12)";
  el.style.color = "#ffffff";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.gap = "16px";
  el.style.width = "min(540px, calc(100vw - 80px))";
  el.style.maxWidth = "100%";

  const iconWrap = el.querySelector("#streak-icon-wrap");
  const iconGlow = el.querySelector("#streak-icon-glow");
  const icon = el.querySelector("#streak-icon");
  const content = el.querySelector("#streak-content");
  const mainTitle = el.querySelector("#streak-main-title");
  const row = el.querySelector("#streak-row");
  const last7Label = el.querySelector("#streak-last7");
  const daysWrap = el.querySelector("#streak-days");
  const dayLabel = el.querySelector("#streak-day-label");

  if (iconWrap) {
    iconWrap.style.position = "relative";
    iconWrap.style.width = "84px";
    iconWrap.style.height = "84px";
    iconWrap.style.flex = "0 0 auto";
  }

  if (iconGlow) {
    iconGlow.style.position = "absolute";
    iconGlow.style.inset = "6px";
    iconGlow.style.borderRadius = "50%";
    iconGlow.style.background = "radial-gradient(circle at 30% 30%, rgba(255,194,102,0.95) 0%, rgba(255,129,76,0.62) 45%, rgba(255,77,109,0.28) 75%, rgba(255,77,109,0) 100%)";
    iconGlow.style.filter = "blur(3px)";
  }

  if (icon) {
    icon.style.position = "relative";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.width = "100%";
    icon.style.height = "100%";
    icon.style.fontSize = "64px";
    icon.style.lineHeight = "1";
    icon.style.filter = "drop-shadow(0 2px 8px rgba(255, 120, 62, 0.6))";
  }

  if (content) {
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "8px";
    content.style.flex = "1";
  }

  if (mainTitle) {
    mainTitle.style.fontSize = "34px";
    mainTitle.style.fontWeight = "800";
    mainTitle.style.lineHeight = "1";
    mainTitle.style.color = "#f6c59d";
    mainTitle.style.letterSpacing = "-0.4px";
  }

  if (row) {
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.marginTop = "2px";
    row.style.flexWrap = "wrap";
  }

  if (last7Label) {
    last7Label.style.fontSize = "14px";
    last7Label.style.color = "rgba(237, 242, 255, 0.72)";
    last7Label.style.whiteSpace = "nowrap";
  }

  if (daysWrap) {
    daysWrap.style.display = "flex";
    daysWrap.style.gap = "6px";
    last7.forEach((day, index) => {
      const dot = document.createElement("div");
      dot.style.width = "14px";
      dot.style.height = "14px";
      dot.style.borderRadius = "4px";
      dot.style.background = levelColors[day.level];
      dot.style.border = index === 6
        ? "1px solid rgba(255, 255, 255, 0.45)"
        : "1px solid rgba(255, 255, 255, 0.08)";
      daysWrap.appendChild(dot);
    });
  }

  if (dayLabel) {
    dayLabel.style.fontSize = "14px";
    dayLabel.style.fontWeight = "700";
    dayLabel.style.color = "rgba(237, 242, 255, 0.9)";
    dayLabel.style.whiteSpace = "nowrap";
  }

  const search = document.querySelector('input[placeholder*="search"]');

  if (search && search.parentElement) {
    search.parentElement.parentElement.insertBefore(el, search.parentElement);
  } else {
    header.appendChild(el);
  }
}

// 🚀 init
async function init() {
  try {
    const streakData = await getStreakData();
    render(streakData);
  } catch (e) {
    console.error("Error:", e);
  }
}

// chạy lần đầu
init();

// 🔁 update mỗi 1 phút (an toàn rate limit)
setInterval(init, 60000);