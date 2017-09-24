#include <iostream>
#include <stdio.h>

using namespace std;

// argc est le nombre de paramètre
// argv est un tableau de chaine contenant les RR
int main(int argc, char *argv[]){

    int indice=0;
    int coherence=0;

    //pour chaque RR
    for (int i = 1; i < argc; i++)
        cout << argv[i] << endl;

    //Retour de l'indice et de la cohérence
    cout << indice << " " << indice << endl;
    return 0;
}
