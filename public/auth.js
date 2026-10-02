(() => {
  const FIREBASE_VERSION = '12.19.0';

  const firebaseConfig = {
    apiKey: "AIzaSyCi5EBQCox0Ipo_CSoHS9zhkBeami7sAL4",
    authDomain: "hth-archive-77fef.firebaseapp.com",
    projectId: "hth-archive-77fef",
    storageBucket: "hth-archive-77fef.firebasestorage.app",
    messagingSenderId: "918931226904",
    appId: "1:918931226904:web:f75bcfffa6bb619b195e6d"
  };

  const nativeFetch = window.fetch.bind(window);

  let currentUser = null;
  let resolveAuthReady;
  let authReadyResolved = false;
  let firebaseAuth = null;
  let googleProvider = null;
  let signInWithPopupFn = null;

  const authReady = new Promise(resolve => {
    resolveAuthReady = resolve;
  });

  window.hthAuth = {
    get user() {
      return currentUser;
    },
    async getIdToken() {
      if (!currentUser) return null;
      return currentUser.getIdToken();
    }
  };

  // API 요청은 Firebase 로그인 확인 뒤 자동으로 Bearer 토큰을 붙입니다.
  window.fetch = async (input, init = {}) => {
    let url;

    try {
      url = new URL(
        typeof input === 'string' || input instanceof URL ? input : input.url,
        window.location.href
      );
    } catch {
      return nativeFetch(input, init);
    }

    const isHTHApi =
      url.origin === window.location.origin &&
      url.pathname.startsWith('/api/');

    if (!isHTHApi) {
      return nativeFetch(input, init);
    }

    const user = await authReady;

    if (!user) {
      throw new Error('로그인이 필요해요.');
    }

    const token = await user.getIdToken();

    const headers = new Headers(
      input instanceof Request ? input.headers : undefined
    );

    new Headers(init.headers || {}).forEach((value, key) => {
      headers.set(key, value);
    });

    headers.set('Authorization', `Bearer ${token}`);

    if (input instanceof Request) {
      const request = new Request(input, {
        ...init,
        headers
      });
      return nativeFetch(request);
    }

    return nativeFetch(input, {
      ...init,
      headers
    });
  };

  document.documentElement.classList.add('hth-auth-pending');

  const style = document.createElement('style');
  style.textContent = `
    .hth-auth-pending .app-shell {
      visibility: hidden !important;
    }

    #hthAuthGate {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at 22% 18%, rgba(218, 211, 255, .58), transparent 34%),
        radial-gradient(circle at 78% 82%, rgba(255, 225, 214, .52), transparent 34%),
        #f8f7fb;
      font-family: Inter, "Noto Sans KR", system-ui, sans-serif;
      color: #26232e;
    }

    #hthAuthGate[hidden] {
      display: none;
    }

    .hth-auth-card {
      width: min(420px, 100%);
      box-sizing: border-box;
      padding: 34px 30px 30px;
      border: 1px solid rgba(92, 82, 122, .13);
      border-radius: 28px;
      background: rgba(255, 255, 255, .92);
      box-shadow: 0 22px 60px rgba(62, 52, 91, .11);
      text-align: center;
      backdrop-filter: blur(18px);
    }

    .hth-auth-logo {
      width: 74px;
      height: 74px;
      object-fit: contain;
      border-radius: 20px;
      margin-bottom: 18px;
    }

    .hth-auth-eyebrow {
      margin: 0 0 7px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #8a7ec4;
    }

    .hth-auth-title {
      margin: 0;
      font-size: 28px;
      line-height: 1.25;
      letter-spacing: -.04em;
    }

    .hth-auth-copy {
      margin: 11px auto 24px;
      max-width: 290px;
      font-size: 14px;
      line-height: 1.65;
      color: #777180;
    }

    .hth-google-login {
      width: 100%;
      min-height: 50px;
      border: 1px solid #ddd9e6;
      border-radius: 15px;
      background: #fff;
      color: #302c37;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 5px 16px rgba(45, 39, 60, .05);
      transition: transform .15s ease, box-shadow .15s ease;
    }

    .hth-google-login:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(45, 39, 60, .08);
    }

    .hth-google-login:disabled {
      opacity: .58;
      cursor: wait;
      transform: none;
    }

    .hth-auth-error {
      min-height: 20px;
      margin: 13px 0 0;
      font-size: 12px;
      line-height: 1.5;
      color: #b34f62;
    }

    .hth-auth-note {
      margin: 12px 0 0;
      font-size: 11px;
      color: #aaa3b1;
    }

    @media (prefers-color-scheme: dark) {
      #hthAuthGate {
        background:
          radial-gradient(circle at 22% 18%, rgba(100, 86, 160, .34), transparent 34%),
          radial-gradient(circle at 78% 82%, rgba(135, 91, 82, .25), transparent 34%),
          #17151c;
        color: #f6f3fa;
      }

      .hth-auth-card {
        border-color: rgba(255,255,255,.08);
        background: rgba(31, 28, 38, .94);
      }

      .hth-auth-copy { color: #aaa5b2; }

      .hth-google-login {
        border-color: #45404e;
        background: #2a2730;
        color: #f8f6fb;
      }
    }
  `;
  document.head.appendChild(style);

  function domReady() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    return Promise.resolve();
  }

  async function ensureGate() {
    await domReady();

    let gate = document.getElementById('hthAuthGate');
    if (gate) return gate;

    gate = document.createElement('div');
    gate.id = 'hthAuthGate';
    gate.innerHTML = `
      <div class="hth-auth-card">
        <img class="hth-auth-logo" src="/assets/hth-icon.png" alt="HTH Archive">
        <p class="hth-auth-eyebrow">HTH Archive</p>
        <h1 class="hth-auth-title">했던 얘기, 또 찾기!</h1>
        <p class="hth-auth-copy">
          나만의 관극 감상 외장 드라이브.<br>
          내 Google 계정으로 로그인해 시작해요.
        </p>
        <button class="hth-google-login" id="hthGoogleLogin" type="button">
          Google로 로그인
        </button>
        <p class="hth-auth-error" id="hthAuthError" aria-live="polite"></p>
        <p class="hth-auth-note">로그인 정보는 Firebase Authentication으로 처리됩니다.</p>
      </div>
    `;

    document.body.appendChild(gate);

    gate.querySelector('#hthGoogleLogin').addEventListener('click', async () => {
      const button = gate.querySelector('#hthGoogleLogin');
      const errorBox = gate.querySelector('#hthAuthError');

      if (!firebaseAuth || !googleProvider || !signInWithPopupFn) {
        errorBox.textContent = '로그인 모듈을 불러오는 중이에요. 잠시 후 다시 눌러 주세요.';
        return;
      }

      button.disabled = true;
      button.textContent = '로그인 중…';
      errorBox.textContent = '';

      try {
        await signInWithPopupFn(firebaseAuth, googleProvider);
      } catch (error) {
        console.error(error);

        if (error?.code === 'auth/popup-closed-by-user') {
          errorBox.textContent = '로그인 창이 닫혔어요. 다시 시도해 주세요.';
        } else if (error?.code === 'auth/popup-blocked') {
          errorBox.textContent = '브라우저가 로그인 팝업을 막았어요. 팝업 허용 후 다시 시도해 주세요.';
        } else if (error?.code === 'auth/unauthorized-domain') {
          errorBox.textContent = 'Firebase Authorized domains에 현재 도메인이 등록되어 있는지 확인해 주세요.';
        } else {
          errorBox.textContent = '로그인 중 오류가 발생했어요.';
        }
      } finally {
        button.disabled = false;
        button.textContent = 'Google로 로그인';
      }
    });

    return gate;
  }

  async function showSignedOut() {
    document.documentElement.classList.add('hth-auth-pending');
    const gate = await ensureGate();
    gate.hidden = false;
  }

  async function showSignedIn() {
    const gate = await ensureGate();
    gate.hidden = true;
    document.documentElement.classList.remove('hth-auth-pending');
  }

  async function startFirebaseAuth() {
    try {
      const [
        { initializeApp },
        {
          getAuth,
          GoogleAuthProvider,
          onAuthStateChanged,
          signInWithPopup,
          setPersistence,
          browserLocalPersistence
        }
      ] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`)
      ]);

      const firebaseApp = initializeApp(firebaseConfig);
      firebaseAuth = getAuth(firebaseApp);
      googleProvider = new GoogleAuthProvider();
      signInWithPopupFn = signInWithPopup;

      await setPersistence(firebaseAuth, browserLocalPersistence);

      onAuthStateChanged(firebaseAuth, async user => {
        currentUser = user || null;

        if (user) {
          if (!authReadyResolved) {
            authReadyResolved = true;
            resolveAuthReady(user);
          }
          await showSignedIn();
        } else {
          await showSignedOut();
        }
      });
    } catch (error) {
      console.error('Firebase Auth initialization failed:', error);

      const gate = await ensureGate();
      gate.hidden = false;
      document.documentElement.classList.add('hth-auth-pending');

      const errorBox = gate.querySelector('#hthAuthError');
      if (errorBox) {
        errorBox.textContent = 'Firebase 로그인을 불러오지 못했어요. 잠시 후 새로고침해 주세요.';
      }
    }
  }

  startFirebaseAuth();
})();
