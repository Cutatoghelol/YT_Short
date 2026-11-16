$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)

Add-Type -AssemblyName System.Speech
Add-Type -ReferencedAssemblies ([System.Speech.Synthesis.SpeechSynthesizer].Assembly.Location) -TypeDefinition @'
using System;
using System.Globalization;
using System.IO;
using System.Speech.Synthesis;

public static class Narrator {
    public static void Record(string text, string stem) {
        using (var voice = new SpeechSynthesizer())
        using (var words = new StreamWriter(stem + ".tsv")) {
            voice.SelectVoice("Microsoft Zira Desktop");
            voice.Rate = 2;
            voice.SpeakProgress += (sender, e) => words.WriteLine(
                e.AudioPosition.TotalSeconds.ToString("F4", CultureInfo.InvariantCulture)
                + "\t" + e.CharacterPosition + "\t" + e.CharacterCount + "\t" + e.Text);
            voice.SetOutputToWaveFile(stem + ".wav");
            voice.Speak(text);
            voice.SetOutputToNull();
        }
    }
}
'@

$text = Get-Content -Raw -Encoding UTF8 -LiteralPath 'SCRIPT.md'
$sections = [regex]::Matches($text, '(?ms)^### (\d+)\u2013(\d+)\r?\n\s*(.+?)(?=^### |\z)')
if ($sections.Count -ne 6) { throw 'Expected six narration beats in SCRIPT.md.' }
$takes = Join-Path (Get-Location).Path 'out/voice-takes'
New-Item -ItemType Directory -Path $takes -Force | Out-Null
foreach ($beat in $sections) {
    $start = $beat.Groups[1].Value
    [Narrator]::Record($beat.Groups[3].Value.Trim(), (Join-Path $takes $start))
}
