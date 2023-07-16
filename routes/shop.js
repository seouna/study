var router = require('express').Router(); // 라우터 파일 필수

function 로그인했니(요청,응답,next){
    //로그인한상태면 항상 존재
    if(요청.user){
      next();
    }else{
      응답.send('로그인안함');
    }
}

//모든라우터들에 로그인했니 미들웨어를 쓰고싶을때는
// 라우터들에 모두 적용할수 있는 미들웨어를 입력하면됨
router.use(로그인했니);

//셔츠로 접속했을때만 로그인했니 실행
// router.use('/shirts',로그인했니);

//로그인한사람만 방문가능하게 하려면 미들웨어 적용시키면됨
router.get('/shirts', function(요청,응답){

    응답.send('셔츠 파는 페이지입니다.');
});
  
  
router.get('/pants', function(요청,응답){
  
    응답.send('바지 파는 페이지입니다.');
});

module.exports = router;
//router라는 변수를 내보내겠다는 말 

// require => 다른파일이나 라이브러리를 쓰겠다