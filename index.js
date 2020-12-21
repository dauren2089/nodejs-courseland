const express = require('express')
const path = require('path')
const csrf = require('csurf')
const flash = require('connect-flash')
const mongoose = require('mongoose')
const exphbs = require('express-handlebars')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const Sentry = require("@sentry/node");
// const Tracing = require("@sentry/tracing");

const homeRoutes = require('./routes/home')
const cardRoutes = require('./routes/card')
const addRoutes = require('./routes/add')
const ordersRoutes = require('./routes/orders')
const coursesRoutes = require('./routes/courses')
const authRoutes = require('./routes/auth')
const User = require('./models/user')
const keys = require('./keys')
const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')

const app = express()
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: require('./utils/hbs-helpers')
})
const store = new MongoDBStore({
  collection: 'sessions',
  uri: keys.MONGODB_URI
})
~
store.on('error', function(error) {
  Sentry.captureException(error);
});

Sentry.init({
  dsn: "https://fde71a2ff3a14c06ac7277794185ed82@o486174.ingest.sentry.io/5542517",
  tracesSampleRate: 1.0,
});

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended: true}))

app.use(session({
  secret: keys.SESSION_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  resave: false,
  saveUninitialized: false,
  store
}));

app.use(csrf())
app.use(flash())
app.use(varMiddleware);
app.use(userMiddleware);

app.use('/', homeRoutes)
app.use('/add', addRoutes)
app.use('/courses', coursesRoutes)
app.use('/card', cardRoutes)
app.use('/orders', ordersRoutes)
app.use('/auth', authRoutes)

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (e) {
    Sentry.captureException(e);
  }
}

start()