
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser'); 
const { param } = require('express/lib/request');
const app = express();
const methodOverride = require('method-override'); //put요청 delete요청쓰기위해 라이브러리설치
app.use(methodOverride('_method'));
//로그인 위한 라이브러리
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false})); // 미들웨어
app.use(passport.initialize());
app.use(passport.session());

app.set('view engin','ejs'); //ejs등록
app.use(express.urlencoded({ extended: true }));
app.use('/public',express.static('public')); //미들웨어

const MongoClient = require('mongodb').MongoClient;

var db; //변수생성
MongoClient.connect(process.env.DB_URL, function(에러, client){
  if (에러) return console.log(에러)

  db = client.db('todoapp'); //db연결
    
});

//어떤 사람이 /add 경로로 POST요청을 하면 ~~를 해주세요
app.post('/add',function (요청,응답) {


  //DB에 저장해주세요    
  db.collection('counter').findOne({name :'게시물갯수'},function (에러,결과) {
      console.log(결과.totalPost);
      var 총게시물갯수 = 결과.totalPost

      db.collection('post').insertOne({_id: 총게시물갯수+1, 제목:요청.body.title,날짜:요청.body.date},function (에러,결과) {
          console.log('저장완료');
          //totalPost 항목도 +1 해야함 수정
          db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost:1}},function(에러,결과){ //콜백함수 : 순차적으로 코드가 진행되야할때
                                                              //operator 써야함 
                                                              //set은 값을 변경 // inc 값을수정 (증가 감소)
              if(에러) return console.log(에러);
              응답.send('전송완료')

          });
      });
  });
});


app.get('/search', (요청,응답) => {
  console.log(요청.query.value);
  //find({제목:요청.query.value}) 일치하는것만 찾아줌
  // db.collection('post').find( { $text:{ $search:요청.query.value } } ).toArray((에러,결과) => {
  // aggregate는 여러개 조건걸수있다

  //몽고디비에서 서치인덱스 사용!!
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: ['제목','날짜']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort : {_id : 1 }},// 아이디 순으로 정렬 -1 내림
    { $limit : 10} //상위에서 10개만
   // { $project :{ 제목 : 1,_id :0, score : {$meta : "searchScore"}}}  // 관련도순정렬
  ] 
  console.log(요청.query);
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
    console.log(결과)
    응답.render('search.ejs', {posts : 결과})
  })

});


app.get('/list',function(요청,응답){

    db.collection('post').find().toArray(function(에러,결과) {
        console.log(결과);
        응답.render('list.ejs',{posts : 결과});
    });

    
    //디비에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요
});



app.listen(8080, function() {
  console.log('listening on 8080')
})



//여기 이하는 쓸데없는 app.get 이런 코드들

app.get('/', function(요청, 응답) { 
//   응답.sendFile(__dirname +'/index.ejs');
  응답.render('index.ejs');
}) 



//누군가가 /pet 으로 방문을 하면 pet관련된 안내문을 띄워주자
app.get('/pet',function(요청,응답) {
    응답.send('펫용품 쇼핑할 수 있는 사이트입니다.');
});

app.get('/beauty',(요청,응답) => {
    응답.send('뷰티용품 쇼핑할 수 있는 사이트입니다.');
});


app.get('/write',function(요청,응답) {
    // 응답.sendFile(__dirname + '/write.ejs');
    응답.render('write.ejs');
 });
 
 app.delete('/delete',function(요청,응답){
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id);
    db.collection('post').deleteOne(요청.body,function(에러,결과){
                                    //삭제할요소
        //delete요청 성공했을시
        console.log('삭제완료');
        응답.status(200).send({message : '성공했습니다'});
    });

 });

 //: 뒤에 오는 문자열을 보내주 세요
 app.get('/detail/:id',function(요청,응답){
    
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러,결과){
        console.log(결과);
       
        응답.render('detail.ejs',{data : 결과});
                           // {이름:데이터}
       
                        
                    
    });
   
                           
 });

 app.get('/edit/:id',function(요청,응답){

    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러,결과){

        응답.render('edit.ejs',{ post : 결과 });
    });
 });

 app.put('/edit',function(요청,응답){

    //폼에 담긴 제목데이터,날짜테이터를 가지고 db.collection에다가 업데이트

    db.collection('post').updateOne({_id : parseInt(요청.body.id) },{$set : {제목 : 요청.body.title,날짜:요청.body.date }},function(에러,결과){
        console.log('수정완료');
        응답.redirect('/list'); //서버코드에서는 응답코드가 필수!!
    });

 });
app.get('/login',function(요청,응답){
    //로그인 페이지보여줌
    응답.render('login.ejs');
});

app.get('/fail',function(요청,응답){
  응답.redirect('/login');
});   
//마이페이지 접속전 실행할 미들웨어처리
app.get('/mypage',로그인했니 ,function(요청,응답){

  //로그인한 사람만 보여줘야함
  console.log(요청.user);
  응답.render('mypage.ejs',{사용자 : 요청.user});
                            //데이터 전달,가져갈때
});

function 로그인했니(요청,응답,next){
  //로그인한상태면 항상 존재
  if(요청.user){
    next();
  }else{
    응답.send('로그인안함');
  }
}



app.get('/fail',function(요청,응답){

  응답.render('login_fail.ejs');
});

app.post('/login',passport.authenticate('local',{
  //로그인 실패시 처리
    failureRedirect : '/fail'
}),function(요청,응답){
    //아이디 비번 맞으면 성공페이지로 보내줘야함
    응답.redirect('/');
});
// 보안 안좋다 
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  // console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)
    
    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })

    //암호화 처리할수있음 해보기!!
    if (입력한비번 == 결과.pw) {
      return done(null, 결과) //serializeUser 결과 전달
    } else {
      return done(null, false, { message: '비번틀렸어요' })
            // 서버에러/성공시사용자DB데이터 / 에러메세지
    }
  })
}));


//세션 저장
passport.serializeUser(function(user,done){
  done(null,user.id);          //결과값이들어감 (결과)
});
//user.id = 아이디
//마이페이지 접속시 - 어떤사람인지 해석할때 사용
passport.deserializeUser(function(아이디, done){
  //디비에서 user.id로 유저를 찾은뒤 유저정보를 {}에 넣음
  db.collection('login').findOne({id: 아이디},function(에러,결과){
    done(null,결과);
              //{id : test / pw : test}
  })
 
});


