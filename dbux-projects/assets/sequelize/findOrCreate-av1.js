/* eslint-disable no-console */
'use strict';

const path = require('path');
const { expect } = require('chai');

const Sequelize = require('.');

const { Model, DataTypes } = Sequelize;


(async () => {
  try {
    const sequelize = new Sequelize('test_db', null, null, {
      dialect: 'sqlite',
      storage: path.join(__dirname, 'test', 'db.sqlite')
    });

    const User = sequelize.define('user', {
      name: Sequelize.STRING,
      age: Sequelize.INTEGER
    });

    await sequelize.sync({ force: true });

    // this works
    const [a1] = await User.finfindOrCreate({
      where: { name: "a" },
      defaults: { age: 1 }
    });
    const [a2] = await User.findOrCreate({
      where: { name: "a" },
      defaults: { age: 2 }
    });
    console.log(`Result A: ${[a1?.dataValues?.age, a2?.dataValues?.age]} === 1, 2, `, a1, a2);

    // this does NOT work
    const [[b1], [b2]] = await Promise.all([
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 1 }
      }),
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 2 }
      })
    ]);
    console.log(`Result B: ${[b1?.dataValues?.age, b2?.dataValues?.age]} === 1, 2, `, b1, b2);


    await sequelize.close();

    // expect(jane.username).to.equal('janedoe');
  }
  catch (err) {
    console.error('####### FAIL\n\n', err);
  }
})();
