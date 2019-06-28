package com.meteocool.utility

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.meteocool.DocumentationFragment
import com.meteocool.MapFragment
import com.meteocool.R
import com.meteocool.location.WebAppInterface
import org.jetbrains.anko.defaultSharedPreferences


class NavDrawerAdapter(private val activity : AppCompatActivity, private val layoutResourceId : Int, private val navDrawerItems: List<NavDrawerItem>)
    : ArrayAdapter<NavDrawerItem>(activity.applicationContext, layoutResourceId, navDrawerItems)
, AdapterView.OnItemClickListener{




    override fun onItemClick(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
        super.getPosition(getItem(position))
        view!!.isSelected = true
        val  mWebView = activity.findViewById(R.id.webView) as WebView
        when (getItem(position)!!.menuHeading) {
                activity.getString(R.string.map_header) -> {
                    val lastState = activity.defaultSharedPreferences.getString("map_url", null)
                    if(lastState != null){
                        mWebView.loadUrl(lastState)
                    }else {
                        activity.supportFragmentManager.beginTransaction()
                            .replace(R.id.fragmentContainer, MapFragment())
                            .commit()
                    }
                }
                activity.getString(R.string.menu_documentation) -> {
                    activity.defaultSharedPreferences.edit()
                        .putString("map_url", mWebView.url)
                        .apply()
                    mWebView.loadUrl(MapFragment.DOC_URL)
                }
            }
    }



    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        var listItem = convertView
        val inflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        listItem = inflater.inflate(layoutResourceId, parent, false)
        val imageIcon = listItem.findViewById<ImageView>(R.id.drawerImgID)
        val menuHeader = listItem.findViewById<TextView>(R.id.drawerHeaderText)

        val folder = navDrawerItems[position]
        imageIcon.setImageResource(folder.imgID)
        menuHeader.text = folder.menuHeading

        return listItem
    }

}
