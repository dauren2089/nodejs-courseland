// Подключаем модели mongoose
const { Schema, model } = require('mongoose')
// Создаем схему
// Описываем свойства данной модели в схеме
const courseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  img: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})
//Метод для корректировки поиска id
courseSchema.method('toClient', function() {
  const course = this.toObject()

  course.id = course._id
  delete course._id

  return course
})
// импортируем модель
module.exports = model('Course', courseSchema)