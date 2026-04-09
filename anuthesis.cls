% This is the anuthesis class that gives a format of the thesis
% according to the ANU regulation.  To use it, say
% \documentclass{anuthesis} 

% You need to supply file format.tex, where you define the packages
% you want to use etc.

% Good luck and save your time!

% Written by M. Imran of university of Durham and last modified on 2001/06/18.

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{anuthesis}[2008/05/27 ANU Computer science thesis class]

%  Here the fontsize you can use.

\newcommand\@anuthesisptsize{12pt}

\DeclareOption{12pt}{\renewcommand\@anuthesisptsize{12pt}}
\DeclareOption{11pt}{\renewcommand\@anuthesisptsize{11pt}}
\DeclareOption{10pt}{\renewcommand\@anuthesisptsize{10pt}}


\ProcessOptions
%
\LoadClass[\@anuthesisptsize,a4paper]{report}

\pagestyle{plain}

%  Here the page setup based on the university of Durham regulation 
\setlength{\voffset}{-1in}  
\setlength{\marginparsep}{0in}  
\setlength{\marginparwidth}{0in}  
\setlength{\marginparpush}{0in}  
\setlength{\hoffset}{-1in}  
\setlength{\oddsidemargin}{1.4in}  
\setlength{\evensidemargin}{0in} 
\setlength{\textwidth}{6in}
\setlength{\topmargin}{0.75in}
\setlength{\headheight}{18pt}
\setlength{\headsep}{16pt}
\setlength{\textheight}{9.6in}
\setlength{\footskip}{0.3in}

%  Redefinition  \tableofcontents  in  report.cls
\makeatletter
\renewcommand\tableofcontents{%
    \if@twocolumn
      \@restonecoltrue\onecolumn
    \else
      \@restonecolfalse
    \fi
    \chapter*{\contentsname
        \@mkboth{\contentsname}{\contentsname}}%
    \@starttoc{toc}%
    \if@restonecol\twocolumn\fi
    }

%  Redefinition \listoffigures in report.cls
\renewcommand\listoffigures{%
    \if@twocolumn
      \@restonecoltrue\onecolumn
    \else
      \@restonecolfalse
    \fi
    \chapter*{\listfigurename
      \@mkboth{\listfigurename}{\listfigurename}}%
    \@starttoc{lof}%
    \if@restonecol\twocolumn\fi
    }

% %  Redefinition \listoftables in report.cls
\renewcommand\listoftables{%
    \if@twocolumn
      \@restonecoltrue\onecolumn
    \else
      \@restonecolfalse
    \fi
    \chapter*{\listtablename
      \@mkboth{\listtablename}{\listtablename}}%
    \@starttoc{lot}%
    \if@restonecol\twocolumn\fi
    }

%  Redefinition thebibliograph in report.cls
\renewenvironment{thebibliography}[1]
     {\chapter*{\bibname
        \@mkboth{\bibname}{\bibname}}%
      \list{\@biblabel{\@arabic\c@enumiv}}%
           {\settowidth\labelwidth{\@biblabel{#1}}%
            \leftmargin\labelwidth
            \advance\leftmargin\labelsep
            \@openbib@code
            \usecounter{enumiv}%
            \let\p@enumiv\@empty
            \renewcommand\theenumiv{\@arabic\c@enumiv}}%
      \sloppy
      \clubpenalty4000
      \@clubpenalty \clubpenalty
      \widowpenalty4000%
      \sfcode`\.\@m}
     {\def\@noitemerr
       {\@latex@warning{Empty `thebibliography' environment}}%
      \endlist}


%  Input the format.tex file.
%\input format.tex
 
%\endinput















