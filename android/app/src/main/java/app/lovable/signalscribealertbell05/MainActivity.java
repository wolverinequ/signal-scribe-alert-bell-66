
package app.lovable.signalscribealertbell05;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register our custom plugin
        registerPlugin(ScreenControlPlugin.class);
    }
}
