var commandMap = { // Key that can be typed
  ESCAPE:'KEY_LEFT_ESC',
  ESC:'KEY_LEFT_ESC',
  MENU:'229',
  END:'KEY_END',
  SPACE:'\' \'',
  TAB:'KEY_TAB',
  PRINTSCREEN:'206',
  ENTER:'KEY_RETURN',
  UPARROW:'KEY_UP_ARROW',
  DOWNARROW:'KEY_DOWN_ARROW',
  LEFTARROW:'KEY_LEFT_ARROW',
  RIGHTARROW:'KEY_RIGHT_ARROW',
  UP:'KEY_UP_ARROW',
  DOWN:'KEY_DOWN_ARROW',
  LEFT:'KEY_LEFT_ARROW',
  RIGHT:'KEY_RIGHT_ARROW',
  CAPSLOCK:'KEY_CAPS_LOCK',
  DELETE:'KEY_DELETE',
  DEL:'KEY_DELETE'
};

var comboMap = { // Key that can only be used in combos
  ALT:'KEY_LEFT_ALT',
  SHIFT:'KEY_LEFT_SHIFT',
  CTRL:'KEY_LEFT_CTRL',
  CONTROL:'KEY_LEFT_CTRL',
  GUI:'KEY_LEFT_GUI',
  WINDOWS:'KEY_LEFT_GUI',
  COMMAND:'KEY_LEFT_GUI'
};

var keyMap = { // Normal keys
  A:'97',
  B:'98',
  C:'99',
  D:'100',
  E:'101',
  F:'102',
  G:'103',
  H:'104',
  I:'105',
  J:'106',
  K:'107',
  L:'108',
  M:'109',
  N:'110',
  O:'111',
  P:'112',
  Q:'113',
  R:'114',
  S:'115',
  T:'116',
  U:'117',
  V:'118',
  W:'119',
  X:'120',
  Y:'121',
  Z:'122'
};

class Dckuinojs {
  constructor() {
    this.keyMap = keyMap;
    this.commandMap = commandMap;
    this.comboMap = comboMap;
  }

  toArduino(inputCode)
  {
    // Check if the parameter is empty or undefined
    if (inputCode === '' || inputCode === undefined)
    {
      console.error('Error: No ducky script was entered !');
      return false;
    }  // Parsing

    var parsedDucky = this._parse(inputCode);
    if (parsedDucky === '' || parsedDucky === undefined)
    {
      return false;
    }  // Returning the total uploadable script

    return '/*\n'
    + ' * Generated with <3 by Dckuino.js, an open source project !\n'
    + ' */\n'
    + '\n// Init function\n'
    + 'void setup()\n'
    + '{\n'
    + '  // Begining the stream\n'
    + '  Keyboard.begin();\n\n'
    + '  // Waiting 500ms for init\n'
    + '  delay(500);\n'
    + '\n' + parsedDucky
    + '}\n'
    + '\n'
    + 'void typeKey(int key)\n'
    + '{\n'
    + '  Keyboard.press(key);\n'
    + '  delay(50);\n'
    + '  Keyboard.release(key);\n'
    + '}\n\n'
    + '// Unused\n'
    + 'void loop() {}';
  }

  // The parsing function
   _parse(toParse)
  {
    // Init chronometer
    var timerStart = Date.now();

    var parsedScript = '';

    // Trim whitespaces
    toParse = toParse.replace(/^ +| +$/gm, "");

    // Cuting the input in lines
    var lineArray = toParse.split('\n');

    // Loop every line
    for (var i = 0; i < lineArray.length; i++)
    {
      // Line empty, skip
      if (lineArray[i] === '' || lineArray[i] === '\n')
      {
        console.log('Info: Skipped line ' + (i + 1) + ', because was empty.');
        continue;
      }

      // Var who indicates to release all at the line end
      var releaseAll = false;

      // Outputs, for REPLAY/REPEAT COMMANDS
      if (parsedOut !== undefined && parsedOut !== '')
      {
        var lastLines = parsedOut;
        var lastCount = ((lastLines.split('\n')).length + 1);
      }
      var parsedOut = '';

      // Command known
      var commandKnown = false;

      // Cutting every line in words
      var wordArray = lineArray[i].split(' ');
      var wordOne = wordArray[0];

      // Handle commands
      switch(wordOne){
        case "STRING":
          wordArray.shift();

          var textString = wordArray.join(' ');

          // Replace all '"' by '\"' and all '\' by '\\'
          textString = textString.split('\\').join('\\\\').split('"').join('\\"');
          if (textString !== '')
          {
            parsedOut += '  Keyboard.print("' + textString + '");\n';
            commandKnown = true;
          } else {
            console.error('Error: at line: ' + (i + 1) + ', STRING needs a text');
            return;
          }
          break;
        case "DELAY":
          wordArray.shift();

          if(wordArray[0] === undefined || wordArray[0] === '') {
            console.error('Error: at line: ' + (i + 1) + ', DELAY needs a time');
            return;
          }

          if (! isNaN(wordArray[0]))
          {
            parsedOut += '  delay(' + wordArray[0] + ');\n';
            commandKnown = true;
          } else {
            console.error('Error: at line: ' + (i + 1) + ', DELAY only acceptes numbers');
            return;
          }
          break;
        case "TYPE":
          wordArray.shift();

          if(wordArray[0] === undefined || wordArray[0] === '') {
            console.error('Error: at line: ' + (i + 1) + ', TYPE needs a key');
            return;
          }

          if (keyMap[wordArray[0]] !== undefined)
          {
            commandKnown = true;
            // Replace the DuckyScript key by the Arduino key name
            parsedOut += '  typeKey(' + keyMap[wordArray[0]] + ');\n';
          } else {
            console.error('Error: Unknown letter \'' + wordArray[0] +'\' at line: ' + (i + 1));
            return;
          }
          break;
        case "REM":
          wordArray.shift();

          // Placing the comment to arduino code
          if (wordArray[0] !== undefined && wordArray[0] !== '')
          {
            commandKnown = true;
            parsedOut += '  // ' + wordArray.join(' ');
          } else {
            console.error('Error: at line: ' + (i + 1) + ', REM needs a comment');
            return;
          }
          break;
        case "REPEAT":
        case "REPLAY":
          wordArray.shift();

          if(wordArray[0] === undefined || wordArray[0] === '') {
            console.error('Error: at line: ' + (i + 1) + ', REPEAT/REPLAY needs a loop count');
            return;
          }

          if (! isNaN(wordArray[0]))
          {
            // Remove the lines we just created
            var linesTmp = parsedScript.split('\n');
            linesTmp.splice(-lastCount, lastCount);
            parsedScript = linesTmp.join('\n');

            // Add two spaces at Begining
            lastLines = lastLines.replace(/^  /gm,'    ');

            // Replace them
            parsedOut += '  for(int i = 0; i < ' + wordArray[0] + '; i++) {\n';
            parsedOut += lastLines;
            parsedOut += '  }\n';

            commandKnown = true;
          } else {
            console.error('Error: at line: ' + (i + 1) + ', REPEAT/REPLAY only acceptes numbers');
            return;
          }
          break;
        default:
          if (wordArray.length == 1)
          {
            if (comboMap[wordArray[0]] !== undefined)
            {
              commandKnown = true;

              parsedOut += '  typeKey(' + comboMap[wordArray[0]] + ');\n';
            }else if (commandMap[wordArray[0]] !== undefined) {
              commandKnown = true;

              parsedOut += '  typeKey(' + commandMap[wordArray[0]] + ');\n';
            }else {
              commandKnown = false;
              break;
            }
            wordArray.shift();
          }
          while (wordArray.length){
            if (comboMap[wordArray[0]] !== undefined)
            {
              commandKnown = true;
              releaseAll = true;

              parsedOut += '  Keyboard.press(' + comboMap[wordArray[0]] + ');\n';
            }else if (commandMap[wordArray[0]] !== undefined) {
              commandKnown = true;
              releaseAll = true;

              parsedOut += '  Keyboard.press(' + commandMap[wordArray[0]] + ');\n';
            }else if (keyMap[wordArray[0]] !== undefined) {
              commandKnown = true;
              releaseAll = true;

              parsedOut += '  Keyboard.press(' + keyMap[wordArray[0]] + ');\n';
            }else {
              commandKnown = false;
              break;
            }
            wordArray.shift();
          }
      }

      if (!commandKnown)
      {
        console.error('Error: Unknown command or key \'' + wordArray[0] + '\' at line: ' + (i + 1) + '.');
        return;
      }

      // If we need to release keys, we do
      if (releaseAll)
        parsedOut += '  Keyboard.releaseAll();\n';

      parsedScript += parsedOut; // Add what we parsed
      if (i != (lineArray.length - 1))
        parsedScript += '\n'; // Add new line if not the last line
    }

    var timerEnd = Date.now();
    var timePassed = new Date(timerEnd - timerStart);

    console.log('Done parsed ' + (lineArray.length) + ' lines in ' + timePassed.getMilliseconds() + 'ms');
    return parsedScript;
  }
}