const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle malformed JSON body errors gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload in request body' });
  }
  next(err);
});

// Session middleware
app.use(session({
  name: 'quiz.sid',
  secret: 'quiz-app-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allows HTTP for local dev
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite DB
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    // Automatically create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      score INTEGER DEFAULT 0
    )`, (createErr) => {
      if (createErr) {
        console.error('Failed to create users table:', createErr.message);
      } else {
        console.log('Users table created or verified.');
      }
    });
  }
});

// Multilingual Cyber Security & Networking quiz questions
// Supports: English (en), 繁體中文 (zh-TW), 日本語 (ja), 한국어 (ko), Русский (ru)
const quizQuestions = [
  {
    id: 1,
    question: {
      en: "What vulnerability allows attackers to manipulate backend database queries via unsanitized input?",
      "zh-TW": "哪種漏洞允許攻擊者透過未過濾的輸入篡改後端資料庫查詢？",
      ja: "サニタイズされていない入力により攻撃者がバックエンドのDBクエリを改ざんできる脆弱性は何ですか？",
      ko: "검증되지 않은 입력을 통해 공격자가 백엔드 데이터베이스 쿼리를 조작할 수 있는 취약점은 무엇인가요?",
      ru: "Какая уязвимость позволяет злоумышленникам манипулировать запросами к БД через несанированные входные данные?"
    },
    options: {
      en: ["SQL Injection (SQLi)", "Cross-Site Scripting (XSS)", "Server-Side Request Forgery (SSRF)", "Insecure Direct Object Reference (IDOR)"],
      "zh-TW": ["SQL 注入 (SQLi)", "跨站腳本 (XSS)", "伺服器端請求偽造 (SSRF)", "不安全的直接物件引用 (IDOR)"],
      ja: ["SQLインジェクション (SQLi)", "クロスサイトスクリプティング (XSS)", "サーバーサイドリクエストフォージェリ (SSRF)", "安全でない直接オブジェクト参照 (IDOR)"],
      ko: ["SQL 인젝션 (SQLi)", "크로스 사이트 스크립팅 (XSS)", "서버 사이드 요청 위조 (SSRF)", "안전하지 않은 직접 객체 참조 (IDOR)"],
      ru: ["SQL-инъекция (SQLi)", "Межсайтовый скриптинг (XSS)", "Подделка запросов на стороне сервера (SSRF)", "Небезопасная прямая ссылка на объект (IDOR)"]
    },
    answer: {
      en: "SQL Injection (SQLi)",
      "zh-TW": "SQL 注入 (SQLi)",
      ja: "SQLインジェクション (SQLi)",
      ko: "SQL 인젝션 (SQLi)",
      ru: "SQL-инъекция (SQLi)"
    }
  },
  {
    id: 2,
    question: {
      en: "Which HTTP header is primarily used to restrict the sources from which scripts and resources can be loaded?",
      "zh-TW": "哪個 HTTP 標頭主要用於限制腳本與資源的載入來源以防止 XSS？",
      ja: "スクリプトやリソースの読み込み元を制限しXSSを防ぐために主に使用されるHTTPヘッダーは何ですか？",
      ko: "스크립트 및 리소스가 로드될 수 있는 출처를 제한하는 데 주로 사용되는 HTTP 헤더는 무엇인가요?",
      ru: "Какой HTTP-заголовок используется для ограничения источников загрузки скриптов и ресурсов?"
    },
    options: {
      en: ["Content-Security-Policy", "Strict-Transport-Security", "Access-Control-Allow-Origin", "X-Content-Type-Options"],
      "zh-TW": ["Content-Security-Policy", "Strict-Transport-Security", "Access-Control-Allow-Origin", "X-Content-Type-Options"],
      ja: ["Content-Security-Policy", "Strict-Transport-Security", "Access-Control-Allow-Origin", "X-Content-Type-Options"],
      ko: ["Content-Security-Policy", "Strict-Transport-Security", "Access-Control-Allow-Origin", "X-Content-Type-Options"],
      ru: ["Content-Security-Policy", "Strict-Transport-Security", "Access-Control-Allow-Origin", "X-Content-Type-Options"]
    },
    answer: {
      en: "Content-Security-Policy",
      "zh-TW": "Content-Security-Policy",
      ja: "Content-Security-Policy",
      ko: "Content-Security-Policy",
      ru: "Content-Security-Policy"
    }
  },
  {
    id: 3,
    question: {
      en: "Which transport protocol uses a 3-way handshake (SYN, SYN-ACK, ACK) to ensure reliable communication?",
      "zh-TW": "哪個傳輸層協定使用三方交握 (SYN, SYN-ACK, ACK) 來建立可靠連線？",
      ja: "信頼性の高い通信を確立するためにスリーウェイハンドシェイク (SYN, SYN-ACK, ACK) を使用するプロトコルは何ですか？",
      ko: "신뢰할 수 있는 연결을 수립하기 위해 3단계 핸드셰이크 (SYN, SYN-ACK, ACK)를 사용하는 전송 계층 프로토콜은 무엇인가요?",
      ru: "Какой транспортный протокол использует трехстороннее рукопожатие (SYN, SYN-ACK, ACK) для надежной связи?"
    },
    options: {
      en: ["TCP", "UDP", "ICMP", "IGMP"],
      "zh-TW": ["TCP", "UDP", "ICMP", "IGMP"],
      ja: ["TCP", "UDP", "ICMP", "IGMP"],
      ko: ["TCP", "UDP", "ICMP", "IGMP"],
      ru: ["TCP", "UDP", "ICMP", "IGMP"]
    },
    answer: {
      en: "TCP",
      "zh-TW": "TCP",
      ja: "TCP",
      ko: "TCP",
      ru: "TCP"
    }
  },
  {
    id: 4,
    question: {
      en: "What cryptographic protocol has officially replaced SSL for secure web communications?",
      "zh-TW": "哪種密碼學協定已正式取代 SSL 用於保護網路通訊安全？",
      ja: "安全なWeb通信のためにSSLを正式に置き換えた暗号化プロトコルは何ですか？",
      ko: "안전한 웹 통신을 위해 SSL을 공식적으로 대체한 암호화 프로토콜은 무엇인가요?",
      ru: "Какой криптографический протокол официально заменил SSL для защиты веб-коммуникаций?"
    },
    options: {
      en: ["TLS", "IPsec", "SSH", "PGP"],
      "zh-TW": ["TLS", "IPsec", "SSH", "PGP"],
      ja: ["TLS", "IPsec", "SSH", "PGP"],
      ko: ["TLS", "IPsec", "SSH", "PGP"],
      ru: ["TLS", "IPsec", "SSH", "PGP"]
    },
    answer: {
      en: "TLS",
      "zh-TW": "TLS",
      ja: "TLS",
      ko: "TLS",
      ru: "TLS"
    }
  },
  {
    id: 5,
    question: {
      en: "What attack tricks an authenticated victim into executing unauthorized actions on a trusted web application?",
      "zh-TW": "哪種攻擊誘騙已驗證的受害者在受信任的 Web 應用程式上執行未經授權的操作？",
      ja: "認証済みのユーザーを騙して信頼されたWebアプリケーション上で不正な操作を実行させる攻撃は何ですか？",
      ko: "인증된 사용자를 속여 신뢰할 수 있는 웹 애플리케이션에서 무단 작업을 실행하게 만드는 공격은 무엇인가요?",
      ru: "Какая атака заставляет аутентифицированного пользователя выполнять несанкционированные действия в веб-приложении?"
    },
    options: {
      en: ["Cross-Site Request Forgery (CSRF)", "Man-in-the-Middle (MitM)", "DNS Spoofing", "Buffer Overflow"],
      "zh-TW": ["跨站請求偽造 (CSRF)", "中間人攻擊 (MitM)", "DNS 欺騙", "緩衝區溢位"],
      ja: ["クロスサイトリクエストフォージェリ (CSRF)", "中間者攻撃 (MitM)", "DNSスプーフィング", "バッファオーバーフロー"],
      ko: ["크로스 사이트 요청 위조 (CSRF)", "중간자 공격 (MitM)", "DNS 스푸핑", "버퍼 오버플로우"],
      ru: ["Подделка межсайтовых запросов (CSRF)", "Атака 'человек посередине' (MitM)", "DNS-спуфинг", "Переполнение буфера"]
    },
    answer: {
      en: "Cross-Site Request Forgery (CSRF)",
      "zh-TW": "跨站請求偽造 (CSRF)",
      ja: "クロスサイトリクエストフォージェリ (CSRF)",
      ko: "크로스 사이트 요청 위조 (CSRF)",
      ru: "Подделка межсайтовых запросов (CSRF)"
    }
  },
  {
    id: 6,
    question: {
      en: "What is the standard TCP port for secure web browsing over HTTPS?",
      "zh-TW": "使用 HTTPS 進行加密安全瀏覽的標準 TCP 連接埠是哪一個？",
      ja: "HTTPSによる安全なWeb通信のための標準TCPポート番号は何番ですか？",
      ko: "HTTPS를 통한 안전한 웹 브라우징을 위한 표준 TCP 포트 번호는 몇 번인가요?",
      ru: "Какой стандартный порт TCP используется для безопасного веб-соединения по HTTPS?"
    },
    options: {
      en: ["443", "80", "8080", "8443"],
      "zh-TW": ["443", "80", "8080", "8443"],
      ja: ["443", "80", "8080", "8443"],
      ko: ["443", "80", "8080", "8443"],
      ru: ["443", "80", "8080", "8443"]
    },
    answer: {
      en: "443",
      "zh-TW": "443",
      ja: "443",
      ko: "443",
      ru: "443"
    }
  },
  {
    id: 7,
    question: {
      en: "Which category of XSS occurs when malicious code is permanently stored in a target database and served to victims?",
      "zh-TW": "當惡意腳本永久儲存在伺服器資料庫中並呈現給受害者時，屬於哪種類型的 XSS？",
      ja: "悪意のあるコードがターゲットのデータベースに永続的に保存され、閲覧者に配信されるXSSは何ですか？",
      ko: "악성 스크립트가 대상 데이터베이스에 영구적으로 저장된 후 피해자들에게 전달되는 XSS 유형은 무엇인가요?",
      ru: "Какая категория XSS возникает, когда вредоносный код сохраняется в БД сервера и отдается жертвам?"
    },
    options: {
      en: ["Stored XSS", "Reflected XSS", "DOM-based XSS", "Self-XSS"],
      "zh-TW": ["儲存型 XSS (Stored XSS)", "反射型 XSS (Reflected XSS)", "DOM 型 XSS", "Self-XSS"],
      ja: ["格納型XSS (Stored XSS)", "反射型XSS (Reflected XSS)", "DOMベースXSS", "セルフXSS"],
      ko: ["저장형 XSS (Stored XSS)", "반사형 XSS (Reflected XSS)", "DOM 기반 XSS", "셀프 XSS"],
      ru: ["Хранимая XSS (Stored XSS)", "Отраженная XSS (Reflected XSS)", "DOM-based XSS", "Self-XSS"]
    },
    answer: {
      en: "Stored XSS",
      "zh-TW": "儲存型 XSS (Stored XSS)",
      ja: "格納型XSS (Stored XSS)",
      ko: "저장형 XSS (Stored XSS)",
      ru: "Хранимая XSS (Stored XSS)"
    }
  },
  {
    id: 8,
    question: {
      en: "Which HTTP status code explicitly indicates that authentication is required or credentials are invalid?",
      "zh-TW": "哪個 HTTP 狀態碼明確表示需要進行身分驗證或提供的認證資訊無效？",
      ja: "認証が必要であること、または認証情報が無効であることを明示するHTTPステータスコードは何ですか？",
      ko: "인증이 필요하거나 제공된 자격 증명이 유효하지 않음을 명시적으로 나타내는 HTTP 상태 코드는 무엇인가요?",
      ru: "Какой код состояния HTTP явно указывает на то, что требуется аутентификация или учетные данные недействительны?"
    },
    options: {
      en: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "404 Not Found"],
      "zh-TW": ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "404 Not Found"],
      ja: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "404 Not Found"],
      ko: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "404 Not Found"],
      ru: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "404 Not Found"]
    },
    answer: {
      en: "401 Unauthorized",
      "zh-TW": "401 Unauthorized",
      ja: "401 Unauthorized",
      ko: "401 Unauthorized",
      ru: "401 Unauthorized"
    }
  }
];

// POST /api/register - User registration endpoint
app.post('/api/register', (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required fields.' });
  }

  const query = `INSERT INTO users (username, password, score) VALUES (?, ?, 0)`;
  db.run(query, [username, password], function(err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists. Please choose another.' });
      }
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      userId: this.lastID
    });
  });
});

// POST /api/login - Authentication endpoint
// INTENTIONALLY VULNERABLE TO SQL INJECTION FOR EDUCATIONAL TESTING
app.post('/api/login', (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  // Intentionally vulnerable string concatenation query
  const vulnerableQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log(`[SQLi Demo] Executing query: ${vulnerableQuery}`);

  db.get(vulnerableQuery, (err, row) => {
    if (err) {
      console.error('[SQL Error]:', err.message);
      return res.status(500).json({
        error: 'SQL Execution Error: ' + err.message,
        query: vulnerableQuery
      });
    }

    if (row) {
      req.session.user = {
        id: row.id,
        username: row.username,
        score: row.score
      };
      return res.json({
        success: true,
        message: 'Login successful.',
        user: {
          id: row.id,
          username: row.username,
          score: row.score
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  });
});

// GET /api/me - Current user session status
app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.json({ user: null });
  }

  // Refresh latest score from database
  db.get('SELECT id, username, score FROM users WHERE id = ?', [req.session.user.id], (err, row) => {
    if (err || !row) {
      return res.json({ user: req.session.user || null });
    }
    req.session.user.score = row.score;
    return res.json({
      user: {
        id: row.id,
        username: row.username,
        score: row.score
      }
    });
  });
});

// POST /api/logout - Logout endpoint
app.post('/api/logout', (req, res) => {
  if (!req.session) {
    res.clearCookie('quiz.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to destroy session: ' + err.message });
    }
    res.clearCookie('quiz.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// GET /api/quiz/next - Fetch quiz question (supports ?lang=en|zh-TW|ja|ko|ru)
// INTENTIONALLY INCLUDES THE `answer` IN THE JSON RESPONSE FOR TESTING
app.get('/api/quiz/next', (req, res) => {
  if (!quizQuestions || quizQuestions.length === 0) {
    return res.status(500).json({ error: 'No quiz questions available.' });
  }

  const requestedLang = req.query.lang || 'en';
  const supportedLangs = ['en', 'zh-TW', 'ja', 'ko', 'ru'];
  const lang = supportedLangs.includes(requestedLang) ? requestedLang : 'en';

  const randomIndex = Math.floor(Math.random() * quizQuestions.length);
  const q = quizQuestions[randomIndex];

  const questionText = (q.question && typeof q.question === 'object') ? (q.question[lang] || q.question.en) : q.question;
  const optionsList = (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) ? (q.options[lang] || q.options.en) : q.options;
  const answerText = (q.answer && typeof q.answer === 'object') ? (q.answer[lang] || q.answer.en) : q.answer;

  res.json({
    id: q.id,
    lang: lang,
    question: questionText,
    options: optionsList,
    answer: answerText
  });
});

// POST /api/quiz/submit - Submit quiz answer
// INTENTIONALLY ACCEPTS `scoreToAdd` DIRECTLY FROM REQUEST BODY
app.post('/api/quiz/submit', (req, res) => {
  const body = req.body || {};

  const targetUsername = (req.session && req.session.user && req.session.user.username)
    || (typeof body.username === 'string' ? body.username.trim() : null);

  if (!targetUsername) {
    return res.status(401).json({ error: 'Please log in to submit quiz answers and save scores.' });
  }

  if (body.scoreToAdd === undefined || body.scoreToAdd === null || body.scoreToAdd === '') {
    return res.status(400).json({ error: 'scoreToAdd field is required.' });
  }

  const addedScore = parseInt(body.scoreToAdd, 10);
  if (isNaN(addedScore)) {
    return res.status(400).json({ error: 'scoreToAdd must be a valid number.' });
  }

  const updateQuery = `UPDATE users SET score = score + ? WHERE username = ?`;
  db.run(updateQuery, [addedScore, targetUsername], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database update failed: ' + err.message });
    }

    db.get('SELECT id, username, score FROM users WHERE username = ?', [targetUsername], (fetchErr, row) => {
      if (fetchErr) {
        return res.status(500).json({ error: 'Error fetching updated score: ' + fetchErr.message });
      }

      if (req.session && req.session.user && req.session.user.username === targetUsername && row) {
        req.session.user.score = row.score;
      }

      return res.json({
        success: true,
        message: `Score updated! Added ${addedScore} points.`,
        scoreAdded: addedScore,
        currentScore: row ? row.score : null,
        user: row || null
      });
    });
  });
});

// GET /api/leaderboard - Top users sorted by score DESC
app.get('/api/leaderboard', (req, res) => {
  const query = `SELECT id, username, score FROM users ORDER BY score DESC, id ASC LIMIT 10`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve leaderboard: ' + err.message });
    }
    return res.json({ leaderboard: rows || [] });
  });
});

// Global 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Quiz Game Server is running on http://localhost:${PORT}`);
});
