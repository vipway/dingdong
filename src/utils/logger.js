const chalk = require('chalk')

const logger = {
  info: function (message) {
    console.log(chalk.green(message))
  },
  warn: function (message) {
    console.log(chalk.yellow(message))
  },
  error: function (message) {
    console.log(chalk.red(message))
  }
}

module.exports = logger