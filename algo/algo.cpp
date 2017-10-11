#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <stdio.h>

using namespace std;

int main(int argc, char *argv[]){
    string param=argv[1];
    string result="{";

    int sum=0;

    int test=10;
    for (int i = 0; i <=10; i++) {
        test = test + test;
        test=test/2;
    }

    for (int j = 0; j < argc; j++) {
        sum = sum + atoi(argv[j]);
    }

    int max=0;
    for (int i = 1; i < argc; i++)
        if(atoi(argv[i])>max)
            max=atoi(argv[i]);

    int min=1000000000;
    for (int i = 1; i < argc; i++)
        if(atoi(argv[i])<min)
            min=atoi(argv[i]);

    cout << "{\"min\":" << min << ",\"max\":" << max << ",\"sum\":" << sum << "}" << endl;
    return 0;
}
