#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <sstream>
#include <map>
#include <iterator>
#include <math.h>

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

void coutTacho(map<int,float> tachoMap){
    cout << "\"tacho\": [";
    bool last = false;
    std::map<int, float>::iterator it = tachoMap.begin();
    while(it != tachoMap.end())
    {
        cout << "{\"x\": " << it->first << ",\"y\": " << it->second << "}";
        if(++it != tachoMap.end()){
            cout << ",";
        }
    }
    cout << "]";
}

void coutCC(map<int,float> tachoMap, int freq){
    cout << "\"cc\": ";
    bool last = false;
    std::map<int, float>::iterator it = tachoMap.begin();
    int a=0;
    int b=0;
    float tmpSecond=0;
    float tmpFirst=0;
    int sens;
    int first=1;
    int tmp=0;
    int tmpMax=0;
    int intervalSum=0;
    int intervalCount=0;
    float intervalAvg=0;
    while(it != tachoMap.end())
    {
        if(it->first != 0 && it->first == freq){
            if(tmpSecond < it->second){
                sens=1;
            }
            else{
                sens=-1;
            }
        }
        else{
            if(sens==1 && tmpSecond > it->second){
                if(first ==1){
                    first=0;
                }

                if(tmpMax!=0){
                    intervalSum+=(tmpFirst-tmpMax);
                    intervalCount++;
                }
                tmpMax=tmpFirst;
            }
            if(tmpSecond < it->second){
                sens=1;
            }
            else{
                sens=-1;
            }
        }
        tmpSecond = it->second;
        tmpFirst = it->first;
        it++;
    }

    if(intervalCount == 0){
        cout << "0";
    }else{
        intervalAvg=intervalSum/intervalCount;

        if(intervalAvg > 10000){
            intervalAvg=20000-intervalAvg;
        }
        cout << round(intervalAvg/100);
    }

}

map<int,float> tachoFilter(map<int,float> tachoMap, int freq){

    map<int,float> tmpTachoMap;
    std::map<int, float>::iterator it = tachoMap.begin();
    bool first=true;

    //Supression des frequences < 40 ou > 200
    while(it != tachoMap.end()){
        cout << it->first << " -> " << it->second << endl;

        if(it->second >= 40 && it->second <= 200){
            tmpTachoMap.insert(std::make_pair(it->first, it->second));
        }
        else{
            if(first){
                tmpTachoMap.insert(std::make_pair(it->first, 60));
            }
        }
        first=false;
        it++;
    }

    cout << "------------------------------------------------" << endl;

    //Réinsertion des frequences manquantes
    map<int,float> filteredTachoMap;
    std::map<int, float>::iterator it2 = tmpTachoMap.begin();
    first=true;
    int currentX=0;
    float xA=0;
    float xB=0;
    float yA=0;
    float yB=0;
    float a,b,c,y;
    while(it2 != tmpTachoMap.end()){
        xB=it2->first;
        yB=it2->second;
        if(currentX == xB){
            cout << currentX << " -> " << yB << endl;
            filteredTachoMap.insert(std::make_pair(currentX, yB));
            currentX+=freq;
        }
        else{
            while(currentX < xB){
                a = calcA(xA, xB, yA,yB);
                b = calcB(xA, yA, a);
                y = (a * currentX) + b;
                cout << currentX << " -> " << y << endl;
                filteredTachoMap.insert(std::make_pair(currentX, y));
                currentX+=freq;
            }
            filteredTachoMap.insert(std::make_pair(currentX, yB));
            cout << currentX << " -> " << yB << endl;
            currentX+=freq;
        }
        xA=xB;
        yA=yB;
        it2++;
    }

    return filteredTachoMap;
}

int main(int argc, char *argv[]){

    string rrList = argv[1];
    vector<string> rrTab;
    int freq=250;
    map<int,float> tachoMap;
    int nbRrTab = split(rrTab, rrList, ',');

    int rrDeb = stoi(rrTab[0]);
    int currentTime=0-rrDeb;

    float xA=0;
    float xB=0;
    float yA=0;
    float yB=0;
    int currentX=0;

    //cout << "{" << endl;

    for(int i = 0; i < nbRrTab; ++i){

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

            tachoMap.insert(std::make_pair(currentX, y));
            currentX+=freq;
	    }

	}

	map<int,float> tachoFilteredMap = tachoFilter(tachoMap, freq);

    coutTacho(tachoMap);
    //cout << "," ;
    //coutCC(tachoMap, freq);
    //cout << "}" ;

    return 0;
}

