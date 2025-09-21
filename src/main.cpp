#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <math.h>

// PCA9685 Setup
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define L1 26.0
#define L2 40.0
#define L3 135.0

#define OFFSET_SERVO2 75.0
#define OFFSET_SERVO3 60.0

#define SERVO_MIN 150
#define SERVO_MAX 600

int degToPWM(int deg)
{
  return map(deg, 0, 180, SERVO_MIN, SERVO_MAX);
}

void solveIK(double x, double y, double z, int &servo1, int &servo2, int &servo3)
{
  double phi1 = atan2(y, x);
  double P1_x = L1 * cos(phi1);
  double P1_y = L1 * sin(phi1);
  double P1_z = 0;
  double x_rel = sqrt(pow(x - P1_x, 2) + pow(y - P1_y, 2));
  double z_rel = z - P1_z;
  double D = (pow(x_rel, 2) + pow(z_rel, 2) - pow(L2, 2) - pow(L3, 2)) / (2 * L2 * L3);
  D = constrain(D, -1, 1);
  double phi3 = -acos(D);
  double phi2 = atan2(z_rel, x_rel) - atan2(L3 * sin(phi3), L2 + L3 * cos(phi3));

  servo1 = round(phi1 * 180.0 / M_PI);
  servo2 = round(OFFSET_SERVO2 - (-phi2 * 180.0 / M_PI));
  servo3 = round(OFFSET_SERVO3 - (phi3 * 180.0 / M_PI));

  servo1 = constrain(servo1, 0, 180);
  servo2 = constrain(servo2, 0, 180);
  servo3 = constrain(servo3, 0, 180);
}

// Bézier-Punkt
void bezierPoint(double t, double P0[3], double P1[3], double P2[3], double P3[3], double out[3])
{
  double u = 1 - t;
  out[0] = u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0];
  out[1] = u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1];
  out[2] = u * u * u * P0[2] + 3 * u * u * t * P1[2] + 3 * u * t * t * P2[2] + t * t * t * P3[2];
}

// Lineare Interpolation (Gerade)
void linearPoint(double t, double A[3], double B[3], double out[3])
{
  out[0] = (1 - t) * A[0] + t * B[0];
  out[1] = (1 - t) * A[1] + t * B[1];
  out[2] = (1 - t) * A[2] + t * B[2];
}

void walk(double points[4][3], int steps, unsigned long duration)
{
  Serial.println("Walk gestartet.");
  int servo1, servo2, servo3;

  while (true)
  {
    unsigned long startTime = millis();

    // --- 1. Teil: Bézier-Kurve P0 -> P3 ---
    for (int i = 0; i <= steps; i++)
    {
      double t = (double)i / steps;
      unsigned long targetTime = startTime + (unsigned long)(t * duration);

      while (millis() < targetTime)
      {
        delay(1);
      }

      double p[3];
      bezierPoint(t, points[0], points[1], points[2], points[3], p);

      solveIK(p[0], p[1], p[2], servo1, servo2, servo3);
      pwm.setPWM(0, 0, degToPWM(servo1));
      pwm.setPWM(1, 0, degToPWM(servo2));
      pwm.setPWM(2, 0, degToPWM(servo3));
    }

    // --- 2. Teil: Gerade P3 -> P0 ---
    double startP[3] = {points[3][0], points[3][1], points[3][2]};
    double endP[3] = {points[0][0], points[0][1], points[0][2]};

    startTime = millis();
    for (int i = 0; i <= steps; i++)
    {
      double t = (double)i / steps;
      unsigned long targetTime = startTime + (unsigned long)(t * duration);

      while (millis() < targetTime)
      {
        delay(1);
      }

      double p[3];
      linearPoint(t, startP, endP, p);

      solveIK(p[0], p[1], p[2], servo1, servo2, servo3);
      pwm.setPWM(0, 0, degToPWM(servo1));
      pwm.setPWM(1, 0, degToPWM(servo2));
      pwm.setPWM(2, 0, degToPWM(servo3));
    }

    // Stop prüfen
    if (Serial.available())
    {
      String input = Serial.readStringUntil('\n');
      input.trim();
      if (input.equalsIgnoreCase("stop"))
      {
        Serial.println("Walk gestoppt.");
        pwm.setPWM(0, 0, 0);
        pwm.setPWM(1, 0, 0);
        pwm.setPWM(2, 0, 0);
        return;
      }
    }
  }
}

void setup()
{
  Serial.begin(9600);
  pwm.begin();
  pwm.setPWMFreq(50);

  Serial.println("Kommandos:");
  Serial.println("  go X Y Z");
  Serial.println("  stop");
  Serial.println("  home");
  Serial.println("  walk x0 y0 z0 ... x3 y3 z3 step delay");
}

void loop()
{
  if (Serial.available())
  {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() == 0)
      return;

    int firstSpace = input.indexOf(' ');
    String cmd = (firstSpace == -1) ? input : input.substring(0, firstSpace);
    cmd.toLowerCase();

    if (cmd == "go")
    {
      String params = input.substring(firstSpace + 1);
      int s1 = params.indexOf(' ');
      int s2 = params.lastIndexOf(' ');

      double x = params.substring(0, s1).toFloat();
      double y = params.substring(s1 + 1, s2).toFloat();
      double z = params.substring(s2 + 1).toFloat();

      int servo1, servo2, servo3;
      solveIK(x, y, z, servo1, servo2, servo3);

      pwm.setPWM(0, 0, degToPWM(servo1));
      pwm.setPWM(1, 0, degToPWM(servo2));
      pwm.setPWM(2, 0, degToPWM(servo3));
    }

    else if (cmd == "home")
    {
      int servo1 = 90, servo2 = 75, servo3 = 60;
      pwm.setPWM(0, 0, degToPWM(servo1));
      pwm.setPWM(1, 0, degToPWM(servo2));
      pwm.setPWM(2, 0, degToPWM(servo3));
    }
    else if (cmd == "walk")
    {
      double pts[4][3];
      int steps = 0;
      unsigned long duration = 0;

      String params = input.substring(firstSpace + 1);
      int idx = 0;

      for (int i = 0; i < 14; i++)
      {
        int spaceIndex = params.indexOf(' ');
        if (spaceIndex == -1 && i < 13)
        {
          Serial.println("Ungültiges Format. Beispiel:");
          Serial.println("walk x0 y0 z0 x1 y1 z1 x2 y2 z2 x3 y3 z3 steps duration");
          return;
        }

        String valStr = (i < 13) ? params.substring(0, spaceIndex) : params;

        if (i < 12)
        {
          // Erste 12 Werte sind Punkte
          pts[idx / 3][idx % 3] = valStr.toFloat();
          idx++;
        }
        else if (i == 12)
        {
          // 13. Wert = steps
          steps = valStr.toInt();
        }
        else if (i == 13)
        {
          // 14. Wert = duration
          duration = valStr.toInt();
        }

        if (i < 13)
          params = params.substring(spaceIndex + 1);
      }
      walk(pts, steps, duration);
    }
  }
}
