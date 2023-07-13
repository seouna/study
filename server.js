

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
MongoClient.connect('mongodb+srv://yuna223:yuna1234@mycluster.ew9r0dj.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러)

  db = client.db('todoapp'); //db연결

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

    
    
                        
   
    
})



app.get('/list',function(요청,응답){

    db.collection('post').find().toArray(function(에러,결과) {
        console.log(결과);
        응답.render('list.ejs',{posts : 결과});
    });

    
    //디비에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요
});



 });//mongodb

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


app.post('/login',passport.authenticate('local',{
    failureRedirect : '/fail'
}),function(요청,응답){
    //아이디 비번 맞으면 성공페이지로 보내줘야함
    응답.redirect('/');
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));
app.get('/fail',function(요청,응답){
    응답.redirect('/login');
});