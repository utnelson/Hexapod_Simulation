#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <math.h>

// PCA9685 Setup
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define L1 26.0   // Basissegment / Höhe
#define L2 40.0   // Oberarm
#define L3 135.0   // Unterarm

#define OFFSET_SERVO2 75.0
#define OFFSET_SERVO3 60.0

#define SERVO_MIN 150 // PCA9685 min PWM
#define SERVO_MAX 600 // PCA9685 max PWM

int degToPWM(int deg) {
  return map(deg, 0, 180, SERVO_MIN, SERVO_MAX);
}


void solveIK(double x, double y, double z, int &servo1, int &servo2, int &servo3) {
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

  // Servo Winkel berechnen (0-180)
  servo1 = round(phi1 * 180.0 / M_PI);                  
  servo2 = round(OFFSET_SERVO2 - (-phi2 * 180.0 / M_PI)); 
  servo3 = round(OFFSET_SERVO3 - (phi3 * 180.0 / M_PI));  
  servo1 = constrain(servo1, 0, 180);
  servo2 = constrain(servo2, 0, 180);
  servo3 = constrain(servo3, 0, 180);
}

void setup() {
  Serial.begin(9600);
  pwm.begin();
  pwm.setPWMFreq(50);

  Serial.print("Gib Zielkoordinaten ein im Format: X Y Z\n");
}

void loop() {
  // Nur weiter wenn seriell Daten verfügbar
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() == 0) return;

    // Splitten nach Leerzeichen
    int firstSpace = input.indexOf(' ');
    int secondSpace = input.lastIndexOf(' ');

    if (firstSpace == -1 || secondSpace == -1 || firstSpace == secondSpace) {
      Serial.print("Ungültiges Format. Beispiel: 100 50 50\n");
      return;
    }

    double x = input.substring(0, firstSpace).toFloat();
    double y = input.substring(firstSpace + 1, secondSpace).toFloat();
    double z = input.substring(secondSpace + 1).toFloat();

    int s1, s2, s3;
    solveIK(x, y, z, s1, s2, s3);

    Serial.print("Servo1: "); Serial.print(s1);
    Serial.print(" Servo2: "); Serial.print(s2);
    Serial.print(" Servo3: "); Serial.println(s3);

    // PWM senden
    pwm.setPWM(0, 0, degToPWM(s1));
    pwm.setPWM(1, 0, degToPWM(s2));
    pwm.setPWM(2, 0, degToPWM(s3));
  }
}

