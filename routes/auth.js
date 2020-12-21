const {Router} = require('express')
const bcrypt = require('bcryptjs')
const Sentry = require("@sentry/node")
const crypto = require('crypto')
const User = require('../models/user')
const keys = require('../keys')
const regEmail = require('../emails/registration')
const resetPass = require('../emails/reset')
const course = require('../models/course')
const user = require('../models/user')
const router = Router()

// Транпортер для отправки писем
const api_key = keys.MAILGUN_API_KEY;
const domain = keys.DOMAIN;
const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
 
const data = {
  from: 'Excited User <me@samples.mailgun.org>',
  to: 'kalis70327@tdcryo.com',
  subject: 'Hello',
  text: 'Testing some Mailgun awesomeness!'
};
 
// Route для входа в систему
router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  })
})
// Route для выхода из системы
router.get('/logout', async (req, res) => {
  // вариант 1: указать isAuthenticated = false
  // req.session.isAuthenticated = false;
  //воспользоваться медотом .destroy, который уничтожает все данные сессии
  req.session.destroy(() => {
    res.redirect('/auth/login#login')
  })
})
// Route для проверки и отправки данных при авторизации
router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body
    const candidate = await User.findOne({ email })

    if (candidate) {
      const areSame = await bcrypt.compare(password, candidate.password)

      if (areSame) {
        req.session.user = candidate
        req.session.isAuthenticated = true
        // Воспользуемся методом .save для ожидания завершения всех операции session
        req.session.save(err => {
          if (err) {
            throw err
          }
          res.redirect('/')
        })
      } else {
        res.redirect('/auth/login#login')
      }
    } else {
      req.flash('loginError', 'Неверный пароль или имя пользователя')
      res.redirect('/auth/login#login')
    }
  } catch (e) {
    Sentry.captureException(e);
  }
})
// Route для проверки и отправки данных при регистрации
router.post('/register', async (req, res) => {
  try {
    const {email, password, repeat, name} = req.body
    const candidate = await User.findOne({ email })
    // проверяем кандидата на похожий email
    if (candidate) {
      req.flash('registerError', 'Пользователь с таким email уже существует')
      res.redirect('/auth/login#register')
    } else {
      // если email свободен, создаем нового пользователя
      const hashPassword = await bcrypt.hash(password, 10)
      const user = new User({
        email, name, password: hashPassword, cart: {items: []}
      })
      // сохраняем в базе
      await user.save()
      res.redirect('/auth/login#login')

      // отправляем сообщение на email пользователя
      await mailgun.messages().send(regEmail(email), function (error, body) {
        console.log(body);
      });

    }
  // ловим ошибки в Sentry
  } catch (e) {
    Sentry.captureException(e);
  }
})
// Route для страницы восстановления пароля
router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Восстановление пароля',
    error: req.flash('error')
  })
})
// Route для проверки и отправки данных при восстановлении пароля
router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.log(err)
      }
      // Генерируем токен
      const token = buffer.toString('hex')
      // Проверяем email
      const candidate = await User.findOne({ email: req.body.email })

      if (candidate) {
        candidate.resetToken = token
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000
        await candidate.save()

        // отправляем сообщение на email пользователя
        await mailgun.messages().send(resetPass(candidate.email, token), function (error, body) {
          console.log(body);
        });
        res.redirect('/auth/login')
      } else {
        req.flash('error', 'Пользователя с таким email не существует')
        res.redirect('/auth/reset')
      }
    })
  } catch (e) {
    Sentry.captureException(e);
  }
})
// Route для отображения страницы обновления пароля
router.get('/password/:token', async (req, res) => {

  // Проверка наличия в параметрах токена
  if (!req.params.token) {
    req.flash('loginError', 'Время жизни токена истекло')
    return res.redirect('/auth/login')
  }
  try {
    // Проверка валидности токена и времени жизни токена в БД
    const candidate = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: {$gt: Date.now()}
    })
      // Проверка наличия user
      if (!candidate) {
        req.flash('loginError', 'Время жизни токена истекло')
        return res.redirect('/auth/login')
      } else {
          // console.log("Token: ", req.params.token)
          res.render('auth/newpass', {
            title: 'Обновление пароля',
            error: req.flash('error'),
            userId: candidate._id.toString(),
            token: req.params.token
          })
      }
  } catch (e) {
    console.log(e)
  }
})
// Route для обновления пароля
router.post('/password', async (req, res) => {
  const { userId, token, password, confirm } = req.body
  // console.log(req.body)
  // обработка ошибок в NODEJS
  try {
    // Проверка валидности токена и времени жизни токена в БД
    const candidate = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: {$gt: Date.now()}
    })
    // console.log('USER: ', candidate)

    if(candidate) {
      // const hashPassword = await bcrypt.hash(password, 10)
      // console.log('PaSS: ', hashPassword)
      // candidate.password = hashPassword
      candidate.password = await bcrypt.hash(req.body.password, 10)
      candidate.resetToken = undefined
      candidate.resetTokenExp = undefined
      await candidate.save();
      res.redirect('/auth/login')

    } else {
      req.flash('loginError', 'Время жизни токена истекло')
      res.redirect('/auth/login');
    }

  } catch(e) {
    console.log(e)
  }
})

module.exports = router