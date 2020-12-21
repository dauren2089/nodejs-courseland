const {Router} = require('express')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const Sentry = require("@sentry/node");
const router = Router()


function isOwner(course, req) {
  return course.userId.toString() === req.user._id.toString()
}

// Маршрут для главной страницы с курсами
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('userId', 'email name')
      .select('price title img')

    // передаем на страницу инфо о курсах и о пользователе(id)
    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      userId: req.user ? req.user._id.toString() : null,
      courses
    })

  } catch(e) {
    Sentry.captureException(e);
  }
})
// Маршрут для редактирования курса
router.get('/:id/edit', auth, async (req, res) => {
  if (!req.query.allow) {
    return res.redirect('/')
  }

  try {
    // const course = await Course.getById(req.params.id)
    // Заменяем метод .getById() на встроенный в Mongoose метод .findById()
    // который находит выбранный курс по ID
    const course = await Course.findById(req.params.id)

    // Проверка доступа USER на изменение курса 
    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }

    //  отрисовка страницы course-edit с параметрами title, course
    res.render('course-edit', {
      title: `Редактировать ${course.title}`,
      course
    })
  } catch (e) {
    Sentry.captureException(e);
  }
})
// Маршрут для отправки данных отредактированных курсов 
router.post('/edit', auth, async (req, res) => {


  try {
    const {id} = req.body
    delete req.body.id

    const course = await Course.findById(id)

    if(!isOwner(course, req)) {
      return res.redirect('/courses')
    }

    Object.assign(course, req.body)
    await course.save()
    // await Course.update(req.body)
    // Заменяем метод .update() на встроенный в Mongoose метод .findByIdAndUpdate()
    // который находит выбранный курс по ID и обновляет содержимое курса
    // await Course.findByIdAndUpdate(id, req.body)
    res.redirect('/courses')

  } catch(e) {
    Sentry.captureException(e);
  }
})
// Марштрут для обработки операции удаления курса
router.post('/remove', auth, async (req, res) => {
  try {
    // Удаленение с проверкой доступа на удление(userId)
    await Course.deleteOne({
      _id: req.body.id,
      userId: req.user._id
    })
    res.redirect('/courses')
  } catch (e) {
    Sentry.captureException(e);
  }
})
// Маршрут для открытия отдельного курса по ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course
    })

  } catch(e) {
    Sentry.captureException(e);
  }
})

module.exports = router