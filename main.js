
// ... (기존 코드는 동일) ...

//-- UI ELEMENTS ---------------------------------------------------------------
// ... (기존 UI 요소들) ...
const copyLinkBtn = document.getElementById('copy-link-btn');
const kakaoShareBtn = document.getElementById('kakao-share-btn');

//-- INITIALIZATION -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    setupScene();
    initKakao(); // 카카오 SDK 초기화
    await loadQuizzes();
    setupEventListeners();
    
    const quizId = window.location.hash.substring(1);
    if (allQuizzes[quizId]) {
        startQuiz(quizId);
    } else {
        showSelectionScreen();
        updateOgTags(); // 메인 페이지 OG 태그로 설정
    }
    
    animate();
});


//-- SETUP FUNCTIONS ----------------------------------------------------------

// ... (setupScene) ...

function setupEventListeners() {
    restartBtn.addEventListener('click', showSelectionScreen);
    copyLinkBtn.addEventListener('click', copyQuizLink);
    kakaoShareBtn.addEventListener('click', shareToKakao);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('hashchange', onHashChange);
}

function initKakao() {
    // 본인의 카카오 앱 JavaScript 키를 입력하세요.
    // 예: Kakao.init('YOUR_JAVASCRIPT_KEY');
    // 지금은 데모용으로 실제 키 없이 기능만 구현합니다.
    try {
        Kakao.init('YOUR_JAVASCRIPT_KEY'); 
        console.log("Kakao SDK initialized.");
    } catch(e) {
        console.warn("Kakao SDK FAILED to initialize. Please check your App Key.");
        kakaoShareBtn.style.display = 'none'; // 키가 없으면 버튼 숨김
    }
}

// ... (loadQuizzes) ...

//-- SCREEN MANAGEMENT & OG TAGS ------------------------------------------------

function showScreen(screenToShow) {
    [selectionScreen, quizScreen, resultScreen].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
}

function showSelectionScreen() {
    showScreen(selectionScreen);
    history.pushState("", document.title, window.location.pathname + window.location.search);
    updateOgTags(); // 메인 OG 태그로 리셋
}

function updateOgTags(quiz = null, resultScore = -1) {
    const title = quiz ? `[퀴즈 결과] ${quiz.title}` : "도전! 퀴즈 킹";
    let description = "당신의 지식을 시험해보세요! 다양한 주제의 퀴즈가 기다리고 있습니다.";
    if (quiz && resultScore !== -1) {
        description = `제가 ${resultScore}/${quiz.questions.length}점을 받았어요! 당신도 도전해보세요!`;
    }

    document.querySelector('meta[property="og:title"]').setAttribute('content', title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', description);
    // 나중에는 퀴즈별 이미지로 변경하는 로직도 추가 가능
    // document.querySelector('meta[property="og:image"]').setAttribute('content', quiz ? quiz.image : '/images/og_main.png');
}


//-- QUIZ LOGIC ---------------------------------------------------------------

function startQuiz(quizId) {
    // ... (기존 startQuiz 로직)
    showScreen(quizScreen);
    showQuestion(currentQuestionIndex);
    updateOgTags(currentQuiz); // 퀴즈 시작 시 OG 태그 업데이트
}

// ... (showQuestion, selectAnswer) ...

function showResult() {
    const totalQuestions = currentQuiz.questions.length;
    finalScoreEl.textContent = `${score} / ${totalQuestions}`;
    showScreen(resultScreen);
    updateOgTags(currentQuiz, score); // 결과와 함께 OG 태그 업데이트
}


//-- SHARE FUNCTIONS ----------------------------------------------------------

function getShareableLink() {
    // 현재 퀴즈의 해시가 포함된 전체 URL 반환
    return window.location.href;
}

function copyQuizLink() {
    const link = getShareableLink();
    navigator.clipboard.writeText(link).then(() => {
        alert("결과 링크가 복사되었어요! 친구에게 공유해보세요!");
    }, (err) => {
        console.error('링크 복사 실패: ', err);
        alert("링크 복사에 실패했어요.");
    });
}

function shareToKakao() {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
        alert("카카오 공유 기능이 현재 동작하지 않습니다.");
        return;
    }
    
    const link = getShareableLink();
    
    Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
            title: `[퀴즈 결과] ${currentQuiz.title}`,
            description: `제가 ${score}/${currentQuiz.questions.length}점을 받았어요! 당신도 도전해보세요!`, 
            imageUrl: 'ABSOLUTE_URL_TO_YOUR_OG_IMAGE.png', // OG 이미지의 전체 주소
            link: {
                mobileWebUrl: link,
                webUrl: link,
            },
        },
        buttons: [
            {
                title: '퀴즈 풀러가기',
                link: {
                    mobileWebUrl: link,
                    webUrl: link,
                },
            },
        ],
    });
}

// ... (Event Handlers & Animation) ...

