const mongoose = require('mongoose');

const keySkillsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  skills: {
    type: [String],
    required: [true, 'Skills array is required'],
    validate: {
      validator: function(skills) {
        return skills.length > 0 && skills.length <= 15;
      },
      message: 'Skills array must contain between 1 and 15 skills'
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

keySkillsSchema.pre('save', function(next) {
  console.log('About to save key skills:', this);
  next();
});

keySkillsSchema.post('save', function(doc, next) {
  console.log('Successfully saved key skills:', doc);
  next();
});

keySkillsSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated key skills:', doc);
  next();
});

module.exports = mongoose.model('KeySkills', keySkillsSchema);
