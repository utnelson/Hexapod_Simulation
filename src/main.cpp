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

#define WALK_STEP 10 // Anzahl Schritte zwischen 0 und 1

// Bézier-Funktion
void bezierPoint(double t, double P0[3], double P1[3], double P2[3], double P3[3], double out[3])
{
  double u = 1 - t;
  out[0] = u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0];
  out[1] = u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1];
  out[2] = u * u * u * P0[2] + 3 * u * u * t * P1[2] + 3 * u * t * t * P2[2] + t * t * t * P3[2];
}

// Walk-Funktion mit 4 Punkten
void walk(double points[4][3])
{
  Serial.println("Walk gestartet.");

  int servo1, servo2, servo3;

  while (true)
  { // Endlosschleife bis Stop
    // Erst Punkt 0 anfahren
    solveIK(points[0][0], points[0][1], points[0][2], servo1, servo2, servo3);
    pwm.setPWM(0, 0, degToPWM(servo1));
    pwm.setPWM(1, 0, degToPWM(servo2));
    pwm.setPWM(2, 0, degToPWM(servo3));
    delay(500);

    // Kurve entlangfahren (t von 0 bis 1)
    for (int i = 0; i <= WALK_STEP; i++)
    {
      double t = (double)i / WALK_STEP;
      double p[3];
      bezierPoint(t, points[0], points[1], points[2], points[3], p);
      solveIK(p[0], p[1], p[2], servo1, servo2, servo3);
      pwm.setPWM(0, 0, degToPWM(servo1));
      pwm.setPWM(1, 0, degToPWM(servo2));
      pwm.setPWM(2, 0, degToPWM(servo3));
      delay(100); // Geschwindigkeit anpassen
    }

    // Wieder zurück zu Punkt 0
    solveIK(points[0][0], points[0][1], points[0][2], servo1, servo2, servo3);
    pwm.setPWM(0, 0, degToPWM(servo1));
    pwm.setPWM(1, 0, degToPWM(servo2));
    pwm.setPWM(2, 0, degToPWM(servo3));
    delay(500);

    // Optional: Abbruch wenn Stop-Kommando empfangen wird
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

  // Serial-Kommandos prüfen
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
      // Parameter parsen: 12 Werte für x0..z3
      double pts[4][3];
      String params = input.substring(firstSpace + 1);
      int idx = 0;
      for (int i = 0; i < 12; i++)
      {
        int spaceIndex = params.indexOf(' ');
        if (spaceIndex == -1 && i < 11)
        {
          Serial.println("Ungültiges Format für walk. Beispiel: walk x0 y0 z0 ... x3 y3 z3");
          return;
        }
        String valStr = (i < 11) ? params.substring(0, spaceIndex) : params;
        pts[idx / 3][idx % 3] = valStr.toFloat();
        if (i < 11)
          params = params.substring(spaceIndex + 1);
        idx++;
      }
      walk(pts);
    }
  }
}
