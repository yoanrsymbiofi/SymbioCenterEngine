#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <sstream>
#include <map>

using namespace std;

int split(vector<string>& vecteur, string chaine, char separateur)
{
	vecteur.clear();
	string::size_type stTemp = chaine.find(separateur);
	while(stTemp != string::npos)
	{
		vecteur.push_back(chaine.substr(0, stTemp));
		chaine = chaine.substr(stTemp + 1);
		stTemp = chaine.find(separateur);
	}
	vecteur.push_back(chaine);
	return vecteur.size();
}

float calcA(float xA, float xB, float yA, float yB){
    return (yB-yA)/(xB-xA);
}

float calcB(float xA, float yA, float a){
    return yA-(a*xA);
}

int main(int argc, char *argv[]){

    string rrList = argv[1];
    vector<string> rrTab;
    int freq=250;
    map<int,unsigned> rrMap;
    int nbRrTab = split(rrTab, rrList, ',');
    int rrDeb = stoi(rrTab[0]);
    int currentTime=0-rrDeb;

    float xA=0;
    float xB=0;
    float yA=0;
    float yB=0;
    int currentX=0;

    cout << "[{\"test\":\"123456789\"},";
    cout << "{\"tacho\":[";
    for(int i = 0; i < nbRrTab; ++i)
	{
	    float rr=stoi(rrTab[i]);
	    float bpm = 60000/rr;
	    currentTime+=rr;
	    xA=xB;
	    yA=yB;
	    xB=currentTime;
	    yB=bpm;

	    while(true){
	        float y;
            if(currentX == currentTime){
                y=bpm;
            } else if(currentX <= xB)
            {
                float a = calcA(xA, xB, yA,yB);
                float b = calcB(xA, yA, a);
                y = (a * currentX) + b;
            }
            else{
                break;
            }
            if(currentX>0){
                cout << ",";
            }
            cout << "{\"y\":" << y << ",\"x\":" << currentX << "}";
            currentX+=freq;
	    }

	}
	cout << "]";
	cout << "}]";

    return 0;
}

