/* eslint-disable no-console */
'use strict';

const path = require('path');
const { expect } = require('chai');
const { createSequelizeInstance } = require('./dev/sscce-helpers');
const { Model, DataTypes } = require('.');

class User extends Model { }

(async () => {
  try {
    const sequelize = createSequelizeInstance({ benchmark: true });
    User.init({
      name: DataTypes.STRING,
      age: DataTypes.INTEGER
    }, { sequelize, modelName: 'user' });
    await sequelize.sync({ force: true });

    // this works
    const [a1] = await User.findOrCreate({
      where: { name: "a" },
      defaults: { age: 1 }
    });
    const [a2] = await User.findOrCreate({
      where: { name: "a" },
      defaults: { age: 2 }
    });
    console.log(`Result A: ${[a1?.dataValues?.age, a2?.dataValues?.age]} === 1, 1`);

    // this also works
    const [b1, b2] = await Promise.all([
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 1 }
      }),
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 2 }
      })
    ]);
    console.log(`Result B: ${[b1?.[0]?.dataValues?.age, b2?.[0]?.dataValues?.age] || 'undefined'} === 1, 1`);


    await sequelize.close();

    // expect(jane.username).to.equal('janedoe');
  }
  catch (err) {
    console.error('####### FAIL\n\n', err);
  }
})();
