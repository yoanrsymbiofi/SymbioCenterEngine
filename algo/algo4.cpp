#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <sstream>
#include <map>
#include <iterator>
#include <math.h>
#include <time.h>

using namespace std;

//Recois une liste de RR et retourne un tacho rééchantillonné, un score de cc,
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
    bool last = false;
    std::map<int, float>::iterator it = tachoMap.begin();
    bool first = true;
    while(it != tachoMap.end())
    {
        if(first){
            first=false;
        }
        else{
            cout << ",";
        }
        cout << "{\"x\": " << it->first << ",\"y\": " << it->second << "}";
        it++;
    }
}

float tachoAvg(map<int,float> tachoMap){
    float total=0;
    int count=0;
    std::map<int, float>::iterator it = tachoMap.begin();
    while(it != tachoMap.end())
    {
        if(it->second >= 40 && it->second <= 200){
            total+=it->second;
            count++;
        }
        it++;
    }
    return (total / count);
}

time_t getTime(){
    return time(NULL);
}

int main(int argc, char *argv[]){

    time_t t0 = clock();

    cout << "[{\"test\":\"123456789\"},";
    cout << "{\"tacho\":[";

    //Transformation rr -> tacho
    vector<string> rrTab;
    int nbRrTab = split(rrTab, argv[1], ',');
    map<int,float> tachoMap;
    int rrDeb = stoi(rrTab[0]);
    int currentTime=0-rrDeb;
    for(int i = 0; i < nbRrTab; ++i){
        float rr = stoi(rrTab[i]);
	    float bpm = 60000/rr;
	    currentTime+=rr;
        tachoMap.insert(std::make_pair(currentTime, bpm));
    }

    //Filtre sur bpm < 40 ou > 200
    std::map<int, float>::iterator it = tachoMap.begin();
    while(it != tachoMap.end())
    {
        if(it->first ==0 && (it->second < 40 || it->second > 200)){
            it->second = tachoAvg(tachoMap);
        }
        else if(it->second < 40 || it->second > 200){
            tachoMap.erase(it);
        }
        it++;
    }

    //Rééchantillonnage
    map<int,float> finalTachoMap;
    float xA=0;
    float xB=0;
    float yA=0;
    float yB=0;
    int currentX=0;
    int freq=250;
    float a,b,c,y;
    it = tachoMap.begin();
    while(it != tachoMap.end()){
        xB=it->first;
        yB=it->second;
        if(xB == 0){
            finalTachoMap.insert(std::make_pair(currentX, yB));
            currentX+=freq;
        }
        else{
                while(true){
                    if(currentX==xB){
                        finalTachoMap.insert(std::make_pair(currentX, yB));
                    }else if (currentX < xB){
                        a = calcA(xA, xB, yA,yB);
                        b = calcB(xA, yA, a);
                        y = (a * currentX) + b;
                        finalTachoMap.insert(std::make_pair(currentX, y));
                    }else{
                        break;
                    }
                    currentX+=freq;

                }
        }
        xA=xB;
        yA=yB;
        it++;
	}

	//Fenêtre glissante ex: 40 dernières secondes
    it = finalTachoMap.begin();
    int time=0;
    while(it != finalTachoMap.end())
    {
        time=it->first;
        it++;
    }
    map<int,float> finalTachoSlidedMap;
    currentX=0;
    int window=40000;
    if(time > window){
        int start = time-window;
        it = finalTachoMap.begin();
        while(it != finalTachoMap.end())
        {
            if(it->first >= start){
                finalTachoSlidedMap.insert(std::make_pair(currentX, it->second));
                currentX+=freq;
            }
            it++;
        }
    }else{
        finalTachoSlidedMap=finalTachoMap;
    }
    coutTacho(finalTachoSlidedMap);

    //Détection des pics
    it = finalTachoSlidedMap.begin();
    float yMax=0;
    int xMax=0;
    float yMax2=0;
    int xMax2=0;
    int tmp=0;
    bool first=true;
    bool second = true;
    bool insertFirstPic = true;
    int precMaxPic=0;
    int countPics=0;
    int total=0;
    while(it != finalTachoSlidedMap.end()){
        if(first){
            first=false;
            yMax=it->second;
            xMax=it->first;
        }
        else{
            if(second){
                second = false;
                if(yMax >= it->second){
                    insertFirstPic=false;
                }
            }
            if(yMax < it->second){
                tmp=0;
            }else{
                tmp++;
            }
            if(tmp==2){
                if(insertFirstPic == true){
                    if(precMaxPic > 0){
                        total+=(xMax2 - precMaxPic);
                        countPics++;
                    }
                    precMaxPic=xMax2;
                }
                insertFirstPic=true;
            }
        }
        yMax2=yMax;
        xMax2=xMax;
        yMax=it->second;
        xMax=it->first;
        it++;
    }


    //Calcul CC
    int cc = 0;
    if(countPics>0){
        float avg = total/countPics;
        if(avg > 10000){
            avg = 10000-(avg-10000);
        }
        cc = round(avg/100);
    }

    cout << "]},";
    cout << "{\"cc\":" << cc << "},";
    cout << "{\"time\":" << (clock()-t0) << "}";
	cout << "]";

    return 0;
}

