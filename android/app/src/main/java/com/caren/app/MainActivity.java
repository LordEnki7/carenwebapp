package com.caren.app;

import android.os.Bundle;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Toast.makeText(this, "CAREN: Activity starting...", Toast.LENGTH_LONG).show();
        try {
            super.onCreate(savedInstanceState);
            Toast.makeText(this, "CAREN: Bridge initialized OK", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "CAREN CRASH: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
