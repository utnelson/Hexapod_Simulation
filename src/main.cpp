#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);

#define S1_J1 0
#define S1_J2 1
#define S1_J3 2

// Length
#define L2 40
#define L3 135

#define SERVO_MIN 150
#define SERVO_MAX 600

void setServo(int channel, float degrees)
{
  degrees = constrain(degrees, 0, 180);
  int pulse = map((int)degrees, 0, 180, SERVO_MIN, SERVO_MAX);
  pwm.setPWM(channel, 0, pulse);
}

struct ServoAngles
{
  int phiJ1;
  int phiJ2;
  int phiJ3;
};

ServoAngles calculate(int x, int y, int z)
{
  ServoAngles result;
  double yzLength, phiB, phiA;
  yzLength = sqrt(y * y + z * z);

  phiB = acos((yzLength * yzLength + L2 * L2 - L3 * L3) / (2 * yzLength * L2));
  phiA = atan(z / y);

  result.phiJ3 = acos((L2 * L2 + L3 * L3 - yzLength * yzLength) / (2 * L2 * L3));
  result.phiJ2 = phiB - phiA;
}

void setup()
{
  Serial.begin(115200);
  pwm.begin();
  pwm.setPWMFreq(50);

  // Startposition
  setServo(S1_J1, 90);
  setServo(S1_J2, 90);
  setServo(S1_J3, 90);
}

void loop()
{
  if (Serial.available())
  {
    String input = Serial.readStringUntil('\n');

    int bIndex = input.indexOf("B:");
    int sIndex = input.indexOf("S:");
    int eIndex = input.indexOf("E:");

    if (bIndex >= 0 && sIndex >= 0 && eIndex >= 0)
    {
      int J1 = input.substring(bIndex + 2, input.indexOf(';', bIndex)).toInt();
      int J2 = input.substring(sIndex + 2, input.indexOf(';', sIndex)).toInt();
      int J3 = input.substring(eIndex + 2, input.indexOf(';', eIndex)).toInt();

      setServo(S1_J1, J1);
      setServo(S1_J2, J2);
      setServo(S1_J3, J3);
    }
  }
}
